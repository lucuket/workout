import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  Exercise,
  RoutineTemplate,
  Workout,
  BodyweightEntry,
  SyncQueueItem,
  UserPreferences,
  PersonalRecord,
} from './types';
import { SEED_EXERCISES, SEED_ROUTINES, generateRealisticHistory } from './seed-data';

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
    value: Workout;
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
    value: any;
  };
}

const DB_NAME = 'gym_workout_tracker_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<GymTrackerDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<GymTrackerDB>> {
  if (typeof window === 'undefined') {
    // Return dummy rejection during SSR
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

// Ensure database is initialized and seeded on first visit
export async function initDatabase(): Promise<void> {
  const db = await getDB();
  const exerciseCount = await db.count('exercises');
  if (exerciseCount === 0) {
    await seedDemoData(true);
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

  // 1. Seed Exercises
  const txEx = db.transaction('exercises', 'readwrite');
  for (const ex of SEED_EXERCISES) {
    await txEx.store.put(ex);
  }
  await txEx.done;

  // 2. Seed Routines
  const txRt = db.transaction('routines', 'readwrite');
  for (const rt of SEED_ROUTINES) {
    await txRt.store.put(rt);
  }
  await txRt.done;

  // 3. Seed Realistic History (3 Months)
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

  // Set default preferences if missing
  const existingPref = await db.get('preferences', 'user_preferences');
  if (!existingPref) {
    const defaultPrefs: UserPreferences = {
      weight_unit: 'lbs',
      barbell_weight: 45,
      default_rest_seconds: 90,
      sound_enabled: true,
      haptic_enabled: true,
      theme: 'dark',
      weekly_goal_workouts: 4,
    };
    await db.put('preferences', { key: 'user_preferences', value: defaultPrefs });
  }
}

// --- Exercises ---
export async function getAllExercises(): Promise<Exercise[]> {
  const db = await getDB();
  return db.getAll('exercises');
}

export async function getExerciseById(id: string): Promise<Exercise | undefined> {
  const db = await getDB();
  return db.get('exercises', id);
}

export async function addCustomExercise(exercise: Exercise): Promise<void> {
  const db = await getDB();
  await db.put('exercises', { ...exercise, is_custom: true, created_at: new Date().toISOString() });
  await enqueueSync('UPSERT_EXERCISE', exercise.id, exercise);
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
  await enqueueSync('UPSERT_ROUTINE', routine.id, routine);
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
  // Sort descending by start time
  return workouts.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
}

export async function getWorkoutById(id: string): Promise<Workout | undefined> {
  const db = await getDB();
  return db.get('workouts', id);
}

export async function saveWorkout(workout: Workout): Promise<void> {
  const db = await getDB();
  await db.put('workouts', workout);
  await enqueueSync('UPSERT_WORKOUT', workout.id, workout);
}

export async function deleteWorkout(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('workouts', id);
  await enqueueSync('DELETE_WORKOUT', id, { id });
}

// --- Active Workout State ---
export async function getActiveWorkout(): Promise<Workout | null> {
  const db = await getDB();
  const active = await db.get('active_workout', 'current_session');
  return active || null;
}

export async function saveActiveWorkout(workout: Workout): Promise<void> {
  const db = await getDB();
  await db.put('active_workout', { ...workout, id: 'current_session' });
}

export async function clearActiveWorkout(): Promise<void> {
  const db = await getDB();
  await db.delete('active_workout', 'current_session');
}

// --- Bodyweight ---
export async function getAllBodyweightEntries(): Promise<BodyweightEntry[]> {
  const db = await getDB();
  const entries = await db.getAllFromIndex('bodyweight', 'by-date');
  return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function logBodyweight(entry: BodyweightEntry): Promise<void> {
  const db = await getDB();
  await db.put('bodyweight', entry);
  await enqueueSync('UPSERT_BODYWEIGHT', entry.id, entry);
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
    return item.value as UserPreferences;
  }
  return {
    weight_unit: 'lbs',
    barbell_weight: 45,
    default_rest_seconds: 90,
    sound_enabled: true,
    haptic_enabled: true,
    theme: 'dark',
    weekly_goal_workouts: 4,
  };
}

export async function saveUserPreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  const db = await getDB();
  const current = await getUserPreferences();
  const updated = { ...current, ...prefs };
  await db.put('preferences', { key: 'user_preferences', value: updated });
  return updated;
}

// --- Previous Session History for Fast Auto-fill ---
export async function getLastPerformanceForExercise(exerciseId: string): Promise<{ weight: number; reps: number } | null> {
  const workouts = await getAllWorkouts();
  for (const w of workouts) {
    const exercise = w.exercises.find((e) => e.exercise_id === exerciseId);
    if (exercise && exercise.sets.length > 0) {
      // Find highest working set
      const completedSets = exercise.sets.filter((s) => s.completed && s.type === 'normal');
      if (completedSets.length > 0) {
        return {
          weight: completedSets[0].weight,
          reps: completedSets[0].reps,
        };
      }
    }
  }
  return null;
}

// --- 1RM & Analytics Calculations ---
// Epley formula: 1RM = Weight * (1 + Reps / 30)
export function calculate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

// Calculate all Personal Records from workouts history
export async function calculatePersonalRecords(): Promise<Record<string, PersonalRecord>> {
  const workouts = await getAllWorkouts();
  const prMap: Record<string, PersonalRecord> = {};

  for (const w of workouts) {
    for (const ex of w.exercises) {
      for (const set of ex.sets) {
        if (!set.completed || set.weight <= 0 || set.reps <= 0) continue;

        const est1RM = calculate1RM(set.weight, set.reps);
        const volume = set.weight * set.reps;

        if (!prMap[ex.exercise_id]) {
          prMap[ex.exercise_id] = {
            exercise_id: ex.exercise_id,
            exercise_name: ex.exercise_name,
            max_weight: { weight: set.weight, reps: set.reps, date: w.start_time, workout_id: w.id },
            max_1rm: { value: est1RM, weight: set.weight, reps: set.reps, date: w.start_time, workout_id: w.id },
            max_volume: { volume, weight: set.weight, reps: set.reps, date: w.start_time, workout_id: w.id },
          };
        } else {
          const rec = prMap[ex.exercise_id];
          if (set.weight > rec.max_weight.weight) {
            rec.max_weight = { weight: set.weight, reps: set.reps, date: w.start_time, workout_id: w.id };
          }
          if (est1RM > rec.max_1rm.value) {
            rec.max_1rm = { value: est1RM, weight: set.weight, reps: set.reps, date: w.start_time, workout_id: w.id };
          }
          if (volume > rec.max_volume.volume) {
            rec.max_volume = { volume, weight: set.weight, reps: set.reps, date: w.start_time, workout_id: w.id };
          }
        }
      }
    }
  }

  return prMap;
}

// --- Sync Queue Helpers ---
export async function enqueueSync(action: any, entityId: string, payload: any): Promise<void> {
  try {
    const db = await getDB();
    const item: SyncQueueItem = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      action,
      entity_id: entityId,
      payload,
      timestamp: new Date().toISOString(),
      retries: 0,
    };
    await db.put('sync_queue', item);
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

export async function removeSyncQueueItem(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('sync_queue', id);
  } catch (err) {
    console.error('Failed to remove sync queue item:', err);
  }
}
