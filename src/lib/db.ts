import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  ActiveWorkoutRecord,
  BackupDataBundle,
  BodyweightEntry,
  Exercise,
  PersonalRecord,
  RoutineTemplate,
  SyncAction,
  SyncQueueItem,
  UserPreferences,
  Workout,
} from './types';
import { DEFAULT_PREFERENCES, generateId } from './constants';
import { SEED_EXERCISES, SEED_ROUTINES, generateRealisticHistory } from './seed-data';
import {
  calculate1RM,
  calculatePersonalRecordsFromWorkouts,
  createEmptyWorkout,
  createWorkoutFromRoutine,
  ExerciseLastPerformance,
  findLastPerformanceByExercise,
} from './workout-utils';

interface PreferenceRecord {
  key: string;
  value: UserPreferences;
}

interface GymTrackerDB extends DBSchema {
  exercises: {
    key: string;
    value: Exercise;
    indexes: { 'by-muscle': string; 'by-equipment': string };
  };
  routines: {
    key: string;
    value: RoutineTemplate;
  };
  workouts: {
    key: string;
    value: Workout;
    indexes: { 'by-start-time': string };
  };
  active_workout: {
    key: string;
    value: ActiveWorkoutRecord;
  };
  bodyweight: {
    key: string;
    value: BodyweightEntry;
    indexes: { 'by-date': string };
  };
  sync_queue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-timestamp': string };
  };
  preferences: {
    key: string;
    value: PreferenceRecord;
  };
}

const DB_NAME = 'gym_workout_tracker_db';
const DB_VERSION = 1;
const ACTIVE_SESSION_KEY = 'current_session';

let dbPromise: Promise<IDBPDatabase<GymTrackerDB>> | null = null;

type ActiveWorkoutListener = (workout: Workout | null) => void;
type SyncQueueListener = () => void;

const activeWorkoutListeners = new Set<ActiveWorkoutListener>();
const syncQueueListeners = new Set<SyncQueueListener>();

export function subscribeActiveWorkout(listener: ActiveWorkoutListener): () => void {
  activeWorkoutListeners.add(listener);
  return () => {
    activeWorkoutListeners.delete(listener);
  };
}

export function subscribeSyncQueueMutations(listener: SyncQueueListener): () => void {
  syncQueueListeners.add(listener);
  return () => {
    syncQueueListeners.delete(listener);
  };
}

function notifyActiveWorkoutListeners(workout: Workout | null): void {
  for (const listener of activeWorkoutListeners) {
    listener(workout);
  }
}

function notifySyncQueueListeners(): void {
  for (const listener of syncQueueListeners) {
    listener();
  }
}

export function getDB(): Promise<IDBPDatabase<GymTrackerDB>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is only accessible in the browser'));
  }

  if (!dbPromise) {
    dbPromise = openDB<GymTrackerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('exercises')) {
          const exStore = db.createObjectStore('exercises', { keyPath: 'id' });
          exStore.createIndex('by-muscle', 'muscle_group');
          exStore.createIndex('by-equipment', 'equipment');
        }
        if (!db.objectStoreNames.contains('routines')) {
          db.createObjectStore('routines', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('workouts')) {
          const wStore = db.createObjectStore('workouts', { keyPath: 'id' });
          wStore.createIndex('by-start-time', 'start_time');
        }
        if (!db.objectStoreNames.contains('active_workout')) {
          db.createObjectStore('active_workout', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('bodyweight')) {
          const bwStore = db.createObjectStore('bodyweight', { keyPath: 'id' });
          bwStore.createIndex('by-date', 'date');
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          syncStore.createIndex('by-timestamp', 'timestamp');
        }
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
      },
    });
  }

  return dbPromise;
}

// Ensure database is initialized and seeded on first visit (and top up new built-in exercises)
export async function initDatabase(): Promise<void> {
  const db = await getDB();
  const exerciseCount = await db.count('exercises');
  if (exerciseCount === 0) {
    await seedDemoData(true);
    return;
  }

  // Non-destructively add any newly seeded built-in exercises missing from older local DBs
  if (exerciseCount < SEED_EXERCISES.length) {
    const existingKeys = new Set(await db.getAllKeys('exercises'));
    const missing = SEED_EXERCISES.filter((ex) => !existingKeys.has(ex.id));
    if (missing.length > 0) {
      const tx = db.transaction('exercises', 'readwrite');
      for (const ex of missing) {
        await tx.store.put(ex);
      }
      await tx.done;
    }
  }
}

// Seed Demo Data (100+ exercises, routines, 3 months realistic history, bodyweight)
export async function seedDemoData(force = false): Promise<void> {
  const db = await getDB();

  if (force) {
    await db.clear('exercises');
    await db.clear('routines');
    await db.clear('workouts');
    await db.clear('bodyweight');
  }

  const txEx = db.transaction('exercises', 'readwrite');
  for (const ex of SEED_EXERCISES) {
    await txEx.store.put(ex);
  }
  await txEx.done;

  const txRt = db.transaction('routines', 'readwrite');
  for (const rt of SEED_ROUTINES) {
    await txRt.store.put(rt);
  }
  await txRt.done;

  const { workouts, bodyweight } = generateRealisticHistory();

  const txWk = db.transaction('workouts', 'readwrite');
  for (const wk of workouts) {
    await txWk.store.put(wk);
  }
  await txWk.done;

  const txBw = db.transaction('bodyweight', 'readwrite');
  for (const bw of bodyweight) {
    await txBw.store.put(bw);
  }
  await txBw.done;

  const existingPref = await db.get('preferences', 'user_preferences');
  if (!existingPref) {
    await db.put('preferences', { key: 'user_preferences', value: DEFAULT_PREFERENCES });
  }
}

// --- Exercises ---
export async function getAllExercises(): Promise<Exercise[]> {
  const db = await getDB();
  const all = await db.getAll('exercises');
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getExerciseById(id: string): Promise<Exercise | undefined> {
  const db = await getDB();
  return db.get('exercises', id);
}

export async function addCustomExercise(exercise: Exercise): Promise<Exercise> {
  const db = await getDB();
  const record: Exercise = {
    ...exercise,
    is_custom: true,
    created_at: exercise.created_at || new Date().toISOString(),
  };
  await db.put('exercises', record);
  await enqueueSync('UPSERT_EXERCISE', record.id, record as unknown as Record<string, unknown>);
  return record;
}

export async function deleteCustomExercise(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('exercises', id);
  await enqueueSync('DELETE_EXERCISE', id, { id });
}

// --- Routines ---
export async function getAllRoutines(): Promise<RoutineTemplate[]> {
  const db = await getDB();
  return db.getAll('routines');
}

export async function getRoutineById(id: string): Promise<RoutineTemplate | undefined> {
  const db = await getDB();
  return db.get('routines', id);
}

export async function saveRoutine(routine: RoutineTemplate): Promise<void> {
  const db = await getDB();
  await db.put('routines', routine);
  await enqueueSync('UPSERT_ROUTINE', routine.id, routine as unknown as Record<string, unknown>);
}

export async function deleteRoutine(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('routines', id);
  await enqueueSync('DELETE_ROUTINE', id, { id });
}

// --- Workouts ---
export async function getAllWorkouts(): Promise<Workout[]> {
  const db = await getDB();
  const workouts = await db.getAllFromIndex('workouts', 'by-start-time');
  return workouts.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
}

export async function getWorkoutById(id: string): Promise<Workout | undefined> {
  const db = await getDB();
  return db.get('workouts', id);
}

export async function saveWorkout(workout: Workout): Promise<Workout> {
  const db = await getDB();
  // Defensive guard against legacy 'current_session' IDs
  const safeWorkout: Workout =
    workout.id === ACTIVE_SESSION_KEY
      ? { ...workout, id: generateId('workout') }
      : workout;
  await db.put('workouts', safeWorkout);
  await enqueueSync('UPSERT_WORKOUT', safeWorkout.id, safeWorkout as unknown as Record<string, unknown>);
  return safeWorkout;
}

export async function deleteWorkout(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('workouts', id);
  await enqueueSync('DELETE_WORKOUT', id, { id });
}

// --- Active Workout State ---
export async function getActiveWorkout(): Promise<Workout | null> {
  const db = await getDB();
  const active = await db.get('active_workout', ACTIVE_SESSION_KEY);
  if (!active) return null;

  const { workout_id, ...rest } = active;
  const realId =
    workout_id ||
    (rest.id === ACTIVE_SESSION_KEY ? generateId('workout') : rest.id);

  return {
    ...rest,
    id: realId,
  };
}

export async function saveActiveWorkout(workout: Workout): Promise<void> {
  const db = await getDB();
  const realId =
    workout.id === ACTIVE_SESSION_KEY ? generateId('workout') : workout.id;

  const record: ActiveWorkoutRecord = {
    ...workout,
    id: ACTIVE_SESSION_KEY,
    workout_id: realId,
  };
  await db.put('active_workout', record);
  notifyActiveWorkoutListeners({ ...workout, id: realId });
}

export async function clearActiveWorkout(): Promise<void> {
  const db = await getDB();
  await db.delete('active_workout', ACTIVE_SESSION_KEY);
  notifyActiveWorkoutListeners(null);
}

export async function startWorkoutFromRoutine(routine: RoutineTemplate): Promise<Workout> {
  const [prefs, workouts] = await Promise.all([getUserPreferences(), getAllWorkouts()]);
  const exerciseIds = routine.exercises.map((e) => e.exercise_id);
  const lastPerfs = findLastPerformanceByExercise(workouts, exerciseIds);
  const workout = createWorkoutFromRoutine(routine, prefs, lastPerfs);
  await saveActiveWorkout(workout);
  return workout;
}

export async function startEmptyWorkout(name = 'Quick Workout'): Promise<Workout> {
  const workout = createEmptyWorkout(name);
  await saveActiveWorkout(workout);
  return workout;
}

// --- Bodyweight ---
export async function getAllBodyweightEntries(): Promise<BodyweightEntry[]> {
  const db = await getDB();
  const entries = await db.getAllFromIndex('bodyweight', 'by-date');
  return entries.sort((a, b) => a.date.localeCompare(b.date));
}

export async function logBodyweight(entry: BodyweightEntry): Promise<void> {
  const db = await getDB();
  await db.put('bodyweight', entry);
  await enqueueSync('UPSERT_BODYWEIGHT', entry.id, entry as unknown as Record<string, unknown>);
}

export async function deleteBodyweight(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('bodyweight', id);
  await enqueueSync('DELETE_BODYWEIGHT', id, { id });
}

// --- User Preferences ---
export async function getUserPreferences(): Promise<UserPreferences> {
  const db = await getDB();
  const item = await db.get('preferences', 'user_preferences');
  if (item && item.value) {
    return { ...DEFAULT_PREFERENCES, ...item.value };
  }
  return { ...DEFAULT_PREFERENCES };
}

export async function saveUserPreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  const db = await getDB();
  const current = await getUserPreferences();
  const updated: UserPreferences = { ...current, ...prefs };
  await db.put('preferences', { key: 'user_preferences', value: updated });
  return updated;
}

// --- Previous Session History for Fast Auto-fill ---
export async function getLastPerformanceForExercise(
  exerciseId: string
): Promise<ExerciseLastPerformance | null> {
  const workouts = await getAllWorkouts();
  const result = findLastPerformanceByExercise(workouts, [exerciseId]);
  return result[exerciseId] || null;
}

export async function getLastPerformancesForExercises(
  exerciseIds: string[]
): Promise<Record<string, ExerciseLastPerformance>> {
  const workouts = await getAllWorkouts();
  return findLastPerformanceByExercise(workouts, exerciseIds);
}

// Re-export calculate1RM for existing imports
export { calculate1RM };

// Calculate all Personal Records from workouts history
export async function calculatePersonalRecords(): Promise<Record<string, PersonalRecord>> {
  const workouts = await getAllWorkouts();
  return calculatePersonalRecordsFromWorkouts(workouts);
}

// --- Backup Export & Import ---
export async function exportBackupData(): Promise<BackupDataBundle> {
  const [preferences, exercises, routines, workouts, bodyweight] = await Promise.all([
    getUserPreferences(),
    getAllExercises(),
    getAllRoutines(),
    getAllWorkouts(),
    getAllBodyweightEntries(),
  ]);

  return {
    version: 1,
    exported_at: new Date().toISOString(),
    preferences,
    exercises,
    routines,
    workouts,
    bodyweight,
  };
}

export async function importBackupData(bundle: BackupDataBundle): Promise<void> {
  if (!bundle || typeof bundle !== 'object' || !Array.isArray(bundle.workouts)) {
    throw new Error('Invalid backup file format.');
  }

  const db = await getDB();

  if (Array.isArray(bundle.exercises) && bundle.exercises.length > 0) {
    const tx = db.transaction('exercises', 'readwrite');
    for (const ex of bundle.exercises) {
      await tx.store.put(ex);
    }
    await tx.done;
  }

  if (Array.isArray(bundle.routines)) {
    const tx = db.transaction('routines', 'readwrite');
    for (const rt of bundle.routines) {
      await tx.store.put(rt);
    }
    await tx.done;
  }

  if (Array.isArray(bundle.workouts)) {
    const tx = db.transaction('workouts', 'readwrite');
    for (const wk of bundle.workouts) {
      await tx.store.put(wk);
    }
    await tx.done;
  }

  if (Array.isArray(bundle.bodyweight)) {
    const tx = db.transaction('bodyweight', 'readwrite');
    for (const bw of bundle.bodyweight) {
      await tx.store.put(bw);
    }
    await tx.done;
  }

  if (bundle.preferences) {
    await saveUserPreferences(bundle.preferences);
  }
}

// --- Remote Merge Helpers (used by Supabase pull sync) ---
export async function mergeRemoteRecords(data: {
  exercises?: Exercise[];
  routines?: RoutineTemplate[];
  workouts?: Workout[];
  bodyweight?: BodyweightEntry[];
}): Promise<void> {
  const db = await getDB();
  const pendingQueue = await getSyncQueue();
  const pendingEntityIds = new Set(pendingQueue.map((item) => item.entity_id));

  if (data.exercises?.length) {
    const tx = db.transaction('exercises', 'readwrite');
    for (const ex of data.exercises) {
      if (!pendingEntityIds.has(ex.id)) {
        await tx.store.put(ex);
      }
    }
    await tx.done;
  }

  if (data.routines?.length) {
    const tx = db.transaction('routines', 'readwrite');
    for (const rt of data.routines) {
      if (!pendingEntityIds.has(rt.id)) {
        await tx.store.put(rt);
      }
    }
    await tx.done;
  }

  if (data.workouts?.length) {
    const tx = db.transaction('workouts', 'readwrite');
    for (const wk of data.workouts) {
      if (!pendingEntityIds.has(wk.id)) {
        await tx.store.put({ ...wk, synced: true });
      }
    }
    await tx.done;
  }

  if (data.bodyweight?.length) {
    const tx = db.transaction('bodyweight', 'readwrite');
    for (const bw of data.bodyweight) {
      if (!pendingEntityIds.has(bw.id)) {
        await tx.store.put(bw);
      }
    }
    await tx.done;
  }
}

// --- Sync Queue Helpers ---
function getEntityTypeForAction(action: SyncAction): string {
  if (action.endsWith('WORKOUT')) return 'workout';
  if (action.endsWith('ROUTINE')) return 'routine';
  if (action.endsWith('EXERCISE')) return 'exercise';
  return 'bodyweight';
}

export async function enqueueSync(
  action: SyncAction,
  entityId: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const db = await getDB();
    const existingQueue = await db.getAllFromIndex('sync_queue', 'by-timestamp');
    const entityType = getEntityTypeForAction(action);

    // Coalesce redundant queued operations for the same entity so offline edits stay compact
    const matching = existingQueue.filter(
      (item) => item.entity_id === entityId && getEntityTypeForAction(item.action) === entityType
    );

    const tx = db.transaction('sync_queue', 'readwrite');
    for (const oldItem of matching) {
      await tx.store.delete(oldItem.id);
    }

    const item: SyncQueueItem = {
      id: generateId('sync'),
      action,
      entity_id: entityId,
      payload,
      timestamp: new Date().toISOString(),
      retries: 0,
    };
    await tx.store.put(item);
    await tx.done;

    notifySyncQueueListeners();
  } catch (err) {
    console.error('Failed to enqueue sync item:', err);
  }
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const db = await getDB();
    return db.getAllFromIndex('sync_queue', 'by-timestamp');
  } catch {
    return [];
  }
}

export async function updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
  try {
    const db = await getDB();
    await db.put('sync_queue', item);
  } catch (err) {
    console.error('Failed to update sync queue item:', err);
  }
}

export async function removeSyncQueueItem(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('sync_queue', id);
  } catch (err) {
    console.error('Failed to remove sync queue item:', err);
  }
}

export async function clearSyncQueue(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear('sync_queue');
    notifySyncQueueListeners();
  } catch (err) {
    console.error('Failed to clear sync queue:', err);
  }
}
