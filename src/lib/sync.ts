import { getSyncQueue, removeSyncQueueItem } from './db';
import { getSupabase, isSupabaseConfigured } from './supabase';
import { SyncQueueItem } from './types';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'pending' | 'local_only';

type StatusListener = (status: SyncStatus, pendingCount: number) => void;
const listeners = new Set<StatusListener>();

let currentStatus: SyncStatus = isSupabaseConfigured ? 'synced' : 'local_only';
let pendingItemsCount = 0;
let isProcessing = false;

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

function notifyListeners() {
  for (const listener of listeners) {
    listener(currentStatus, pendingItemsCount);
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

  if (queue.length === 0) {
    currentStatus = 'synced';
    notifyListeners();
    return;
  }

  if (isProcessing) return;

  isProcessing = true;
  currentStatus = 'syncing';
  notifyListeners();

  const supabase = getSupabase();
  if (!supabase) {
    currentStatus = 'local_only';
    isProcessing = false;
    notifyListeners();
    return;
  }

  try {
    for (const item of queue) {
      const success = await processSyncItem(supabase, item);
      if (success) {
        await removeSyncQueueItem(item.id);
      }
    }
  } catch (err) {
    console.error('Error processing sync queue:', err);
  } finally {
    isProcessing = false;
    const remaining = await getSyncQueue();
    pendingItemsCount = remaining.length;
    currentStatus = remaining.length > 0 ? 'pending' : 'synced';
    notifyListeners();
  }
}

async function processSyncItem(supabase: any, item: SyncQueueItem): Promise<boolean> {
  try {
    const { action, payload } = item;

    switch (action) {
      case 'UPSERT_WORKOUT':
        const { error: wErr } = await supabase.from('workouts').upsert(payload);
        return !wErr;

      case 'DELETE_WORKOUT':
        const { error: dwErr } = await supabase.from('workouts').delete().eq('id', payload.id);
        return !dwErr;

      case 'UPSERT_ROUTINE':
        const { error: rErr } = await supabase.from('routines').upsert(payload);
        return !rErr;

      case 'DELETE_ROUTINE':
        const { error: drErr } = await supabase.from('routines').delete().eq('id', payload.id);
        return !drErr;

      case 'UPSERT_EXERCISE':
        const { error: exErr } = await supabase.from('exercises').upsert(payload);
        return !exErr;

      case 'UPSERT_BODYWEIGHT':
        const { error: bwErr } = await supabase.from('bodyweight_logs').upsert(payload);
        return !bwErr;

      case 'DELETE_BODYWEIGHT':
        const { error: dbwErr } = await supabase.from('bodyweight_logs').delete().eq('id', payload.id);
        return !dbwErr;

      default:
        return true;
    }
  } catch (err) {
    console.error(`Sync failure for item ${item.id}:`, err);
    return false;
  }
}

// Initialize listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    checkAndProcessSync();
  });

  window.addEventListener('offline', () => {
    currentStatus = 'offline';
    notifyListeners();
  });

  // Periodic check every 30 seconds
  setInterval(() => {
    if (navigator.onLine && isSupabaseConfigured) {
      checkAndProcessSync();
    }
  }, 30000);
}
