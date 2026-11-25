import { SupabaseClient } from '@supabase/supabase-js';
import {
  getSyncQueue,
  mergeRemoteRecords,
  removeSyncQueueItem,
  subscribeSyncQueueMutations,
  updateSyncQueueItem,
} from './db';
import { getSupabase, isSupabaseConfigured } from './supabase';
import {
  BodyweightEntry,
  Exercise,
  RoutineTemplate,
  SyncAction,
  SyncQueueItem,
  Workout,
} from './types';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'pending' | 'auth_required' | 'local_only';

type StatusListener = (status: SyncStatus, pendingCount: number) => void;
const listeners = new Set<StatusListener>();

let currentStatus: SyncStatus = isSupabaseConfigured ? 'synced' : 'local_only';
let pendingItemsCount = 0;
let isProcessing = false;
let listenersInitialized = false;

export function getSyncState(): { status: SyncStatus; pendingCount: number } {
  return { status: currentStatus, pendingCount: pendingItemsCount };
}

export function subscribeSyncState(listener: StatusListener): () => void {
  listeners.add(listener);
  listener(currentStatus, pendingItemsCount);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(): void {
  for (const listener of listeners) {
    listener(currentStatus, pendingItemsCount);
  }
}

/**
 * Strips client-only fields and attaches the authenticated user_id to match
 * exact PostgreSQL table columns and RLS policies in supabase/schema.sql.
 */
export function buildRemotePayload(
  action: SyncAction,
  payload: Record<string, unknown>,
  userId: string
): Record<string, unknown> {
  switch (action) {
    case 'UPSERT_WORKOUT':
      return {
        id: payload.id,
        name: payload.name,
        routine_id: payload.routine_id ?? null,
        start_time: payload.start_time,
        end_time: payload.end_time ?? null,
        duration_seconds: payload.duration_seconds ?? 0,
        notes: payload.notes ?? null,
        exercises: payload.exercises ?? [],
        total_volume: payload.total_volume ?? 0,
        total_sets: payload.total_sets ?? 0,
        total_reps: payload.total_reps ?? 0,
        pr_count: payload.pr_count ?? 0,
        created_at: payload.created_at ?? new Date().toISOString(),
        updated_at: payload.updated_at ?? new Date().toISOString(),
        user_id: userId,
      };

    case 'UPSERT_ROUTINE':
      return {
        id: payload.id,
        name: payload.name,
        category: payload.category ?? null,
        description: payload.description ?? null,
        exercises: payload.exercises ?? [],
        created_at: payload.created_at ?? new Date().toISOString(),
        updated_at: payload.updated_at ?? new Date().toISOString(),
        user_id: userId,
      };

    case 'UPSERT_EXERCISE':
      return {
        id: payload.id,
        name: payload.name,
        muscle_group: payload.muscle_group,
        secondary_muscles: payload.secondary_muscles ?? [],
        equipment: payload.equipment,
        instructions: payload.instructions ?? null,
        is_custom: true,
        created_at: payload.created_at ?? new Date().toISOString(),
        user_id: userId,
      };

    case 'UPSERT_BODYWEIGHT':
      return {
        id: payload.id,
        date: payload.date,
        weight: payload.weight,
        notes: payload.notes ?? null,
        created_at: payload.created_at ?? new Date().toISOString(),
        user_id: userId,
      };

    default:
      return payload;
  }
}

export async function checkAndProcessSync(): Promise<void> {
  if (typeof window === 'undefined') return;

  const queue = await getSyncQueue();
  pendingItemsCount = queue.length;

  if (!isSupabaseConfigured) {
    currentStatus = 'local_only';
    notifyListeners();
    return;
  }

  if (!navigator.onLine) {
    currentStatus = 'offline';
    notifyListeners();
    return;
  }

  const supabase = getSupabase();
  if (!supabase) {
    currentStatus = 'local_only';
    notifyListeners();
    return;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    currentStatus = 'auth_required';
    notifyListeners();
    return;
  }

  if (queue.length === 0) {
    currentStatus = 'synced';
    notifyListeners();
    return;
  }

  if (isProcessing) return;

  isProcessing = true;
  currentStatus = 'syncing';
  notifyListeners();

  try {
    for (const item of queue) {
      const result = await processSyncItem(supabase, item, user.id);
      if (result.ok) {
        await removeSyncQueueItem(item.id);
      } else {
        await updateSyncQueueItem({
          ...item,
          retries: item.retries + 1,
          last_error: result.error,
        });
      }
    }
  } catch (err) {
    console.error('Error processing sync queue:', err);
  } finally {
    isProcessing = false;
    const remaining = await getSyncQueue();
    pendingItemsCount = remaining.length;
    currentStatus = !navigator.onLine ? 'offline' : remaining.length > 0 ? 'pending' : 'synced';
    notifyListeners();
  }
}

/**
 * Pulls the authenticated user's records from Supabase and merges them into IndexedDB
 * without overwriting items that have pending local offline changes.
 */
export async function pullFromSupabase(): Promise<boolean> {
  if (typeof window === 'undefined' || !isSupabaseConfigured || !navigator.onLine) {
    return false;
  }

  const supabase = getSupabase();
  if (!supabase) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  try {
    const [exRes, rtRes, wkRes, bwRes] = await Promise.all([
      supabase.from('exercises').select('*').eq('user_id', user.id),
      supabase.from('routines').select('*').eq('user_id', user.id),
      supabase.from('workouts').select('*').eq('user_id', user.id),
      supabase.from('bodyweight_logs').select('*').eq('user_id', user.id),
    ]);

    await mergeRemoteRecords({
      exercises: (exRes.data || []) as Exercise[],
      routines: (rtRes.data || []) as RoutineTemplate[],
      workouts: (wkRes.data || []) as Workout[],
      bodyweight: (bwRes.data || []) as BodyweightEntry[],
    });

    return true;
  } catch (err) {
    console.error('Failed to pull remote records:', err);
    return false;
  }
}

async function processSyncItem(
  supabase: SupabaseClient,
  item: SyncQueueItem,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { action, payload } = item;
    const entityId = String(payload.id || item.entity_id);

    switch (action) {
      case 'UPSERT_WORKOUT': {
        const { error } = await supabase
          .from('workouts')
          .upsert(buildRemotePayload(action, payload, userId));
        return error ? { ok: false, error: error.message } : { ok: true };
      }

      case 'DELETE_WORKOUT': {
        const { error } = await supabase
          .from('workouts')
          .delete()
          .eq('id', entityId)
          .eq('user_id', userId);
        return error ? { ok: false, error: error.message } : { ok: true };
      }

      case 'UPSERT_ROUTINE': {
        const { error } = await supabase
          .from('routines')
          .upsert(buildRemotePayload(action, payload, userId));
        return error ? { ok: false, error: error.message } : { ok: true };
      }

      case 'DELETE_ROUTINE': {
        const { error } = await supabase
          .from('routines')
          .delete()
          .eq('id', entityId)
          .eq('user_id', userId);
        return error ? { ok: false, error: error.message } : { ok: true };
      }

      case 'UPSERT_EXERCISE': {
        const { error } = await supabase
          .from('exercises')
          .upsert(buildRemotePayload(action, payload, userId));
        return error ? { ok: false, error: error.message } : { ok: true };
      }

      case 'DELETE_EXERCISE': {
        const { error } = await supabase
          .from('exercises')
          .delete()
          .eq('id', entityId)
          .eq('user_id', userId);
        return error ? { ok: false, error: error.message } : { ok: true };
      }

      case 'UPSERT_BODYWEIGHT': {
        const { error } = await supabase
          .from('bodyweight_logs')
          .upsert(buildRemotePayload(action, payload, userId));
        return error ? { ok: false, error: error.message } : { ok: true };
      }

      case 'DELETE_BODYWEIGHT': {
        const { error } = await supabase
          .from('bodyweight_logs')
          .delete()
          .eq('id', entityId)
          .eq('user_id', userId);
        return error ? { ok: false, error: error.message } : { ok: true };
      }

      default:
        return { ok: true };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown sync error';
    console.error(`Sync failure for item ${item.id}:`, err);
    return { ok: false, error: message };
  }
}

export function initSyncListeners(): void {
  if (typeof window === 'undefined' || listenersInitialized) return;
  listenersInitialized = true;

  window.addEventListener('online', () => {
    void checkAndProcessSync();
  });

  window.addEventListener('offline', () => {
    currentStatus = isSupabaseConfigured ? 'offline' : 'local_only';
    notifyListeners();
  });

  // Flush queue promptly whenever local IndexedDB enqueues a mutation
  subscribeSyncQueueMutations(() => {
    void checkAndProcessSync();
  });

  const supabase = getSupabase();
  if (supabase) {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        void checkAndProcessSync().then(() => pullFromSupabase());
      } else if (event === 'SIGNED_OUT') {
        currentStatus = 'auth_required';
        notifyListeners();
      }
    });
  }

  // Periodic retry for failed/pending items
  window.setInterval(() => {
    if (navigator.onLine && isSupabaseConfigured) {
      void checkAndProcessSync();
    }
  }, 30000);
}
