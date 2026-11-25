import {
  PersonalRecord,
  RoutineTemplate,
  UserPreferences,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from './types';
import { generateId } from './constants';

export interface ExerciseLastPerformance {
  weight: number;
  reps: number;
  sets: { weight: number; reps: number }[];
}

export interface WorkoutStats {
  total_volume: number;
  total_sets: number;
  total_reps: number;
}

export interface WeeklyMetrics {
  currentStreakWeeks: number;
  thisWeekCount: number;
  thisWeekWorkouts: Workout[];
}

/**
 * Epley formula: 1RM = Weight * (1 + Reps / 30)
 */
export function calculate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return Math.round(weight * 10) / 10;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}

/**
 * Computes volume, completed sets, and completed reps across a workout's exercises.
 */
export function calculateWorkoutStats(exercises: WorkoutExercise[]): WorkoutStats {
  let total_volume = 0;
  let total_sets = 0;
  let total_reps = 0;

  for (const ex of exercises) {
    for (const set of ex.sets) {
      if (set.completed) {
        total_sets += 1;
        total_reps += set.reps;
        total_volume += set.weight * set.reps;
      }
    }
  }

  return {
    total_volume: Math.round(total_volume * 10) / 10,
    total_sets,
    total_reps,
  };
}

/**
 * Computes all-time Personal Records from a list of workouts.
 */
export function calculatePersonalRecordsFromWorkouts(
  workouts: Workout[]
): Record<string, PersonalRecord> {
  const prMap: Record<string, PersonalRecord> = {};

  for (const w of workouts) {
    for (const ex of w.exercises) {
      for (const set of ex.sets) {
        if (!set.completed || set.weight <= 0 || set.reps <= 0) continue;

        const est1RM = calculate1RM(set.weight, set.reps);
        const volume = Math.round(set.weight * set.reps * 10) / 10;

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

/**
 * Counts how many exercises in a newly finished workout hit a new max weight or est. 1RM PR.
 */
export function countNewPRs(
  exercises: WorkoutExercise[],
  existingPRs: Record<string, PersonalRecord>
): number {
  let prCount = 0;

  for (const ex of exercises) {
    const existing = existingPRs[ex.exercise_id];
    for (const set of ex.sets) {
      if (!set.completed || set.weight <= 0 || set.reps <= 0) continue;
      const est1RM = calculate1RM(set.weight, set.reps);
      if (!existing || set.weight > existing.max_weight.weight || est1RM > existing.max_1rm.value) {
        prCount += 1;
        break;
      }
    }
  }

  return prCount;
}

/**
 * Batch-resolves the most recent working performance for a set of exercise IDs
 * using a single pass over descending-sorted workouts.
 */
export function findLastPerformanceByExercise(
  workoutsDescending: Workout[],
  exerciseIds: string[]
): Record<string, ExerciseLastPerformance> {
  const remaining = new Set(exerciseIds);
  const result: Record<string, ExerciseLastPerformance> = {};

  for (const w of workoutsDescending) {
    if (remaining.size === 0) break;

    for (const ex of w.exercises) {
      if (!remaining.has(ex.exercise_id)) continue;

      const workingSets = ex.sets.filter((s) => s.completed && s.type !== 'warmup');
      const fallbackSets = workingSets.length > 0 ? workingSets : ex.sets.filter((s) => s.completed);

      if (fallbackSets.length > 0) {
        // Choose heaviest completed working set as default auto-fill target
        const heaviest = fallbackSets.reduce((best, cur) =>
          cur.weight > best.weight || (cur.weight === best.weight && cur.reps > best.reps)
            ? cur
            : best
        );

        result[ex.exercise_id] = {
          weight: heaviest.weight,
          reps: heaviest.reps,
          sets: fallbackSets.map((s) => ({ weight: s.weight, reps: s.reps })),
        };
        remaining.delete(ex.exercise_id);
      }
    }
  }

  return result;
}

/**
 * Parses a target rep string like "8-12" or "5" into a sensible default numeric rep target.
 */
export function parseTargetReps(targetReps?: string): number {
  if (!targetReps) return 10;
  const match = /\d+/.exec(targetReps);
  if (!match) return 10;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
}

/**
 * Builds a fresh active Workout from a RoutineTemplate and historical last-session performance.
 */
export function createWorkoutFromRoutine(
  routine: RoutineTemplate,
  prefs: UserPreferences,
  lastPerformances: Record<string, ExerciseLastPerformance>
): Workout {
  const nowIso = new Date().toISOString();

  const workoutExercises: WorkoutExercise[] = routine.exercises.map((re, exIdx) => {
    const lastPerf = lastPerformances[re.exercise_id];
    const defaultWeight = re.equipment === 'Bodyweight' ? 0 : prefs.barbell_weight;
    const defaultReps = parseTargetReps(re.target_reps);
    const setCount = Math.max(1, re.target_sets || 3);

    const sets: WorkoutSet[] = Array.from({ length: setCount }).map((_, sIdx) => {
      const prevSet = lastPerf?.sets[sIdx] || lastPerf;
      return {
        id: generateId('set'),
        set_number: sIdx + 1,
        type: 'normal',
        weight: prevSet ? prevSet.weight : defaultWeight,
        reps: prevSet ? prevSet.reps : defaultReps,
        previous_weight: prevSet ? prevSet.weight : undefined,
        previous_reps: prevSet ? prevSet.reps : undefined,
        completed: false,
      };
    });

    return {
      id: generateId('we'),
      exercise_id: re.exercise_id,
      exercise_name: re.exercise_name,
      muscle_group: re.muscle_group,
      equipment: re.equipment,
      order: exIdx + 1,
      rest_seconds: re.target_rest_seconds || prefs.default_rest_seconds,
      notes: re.notes,
      sets,
    };
  });

  return {
    id: generateId('workout'),
    name: routine.name,
    routine_id: routine.id,
    start_time: nowIso,
    duration_seconds: 0,
    exercises: workoutExercises,
    total_volume: 0,
    total_sets: 0,
    total_reps: 0,
    pr_count: 0,
    created_at: nowIso,
    updated_at: nowIso,
    synced: false,
  };
}

/**
 * Builds a blank active workout session.
 */
export function createEmptyWorkout(name = 'Quick Workout'): Workout {
  const nowIso = new Date().toISOString();
  return {
    id: generateId('workout'),
    name,
    start_time: nowIso,
    duration_seconds: 0,
    exercises: [],
    total_volume: 0,
    total_sets: 0,
    total_reps: 0,
    pr_count: 0,
    created_at: nowIso,
    updated_at: nowIso,
    synced: false,
  };
}

/**
 * Computes consecutive 7-day training week streak (requiring at least `minPerWeek` workouts per week)
 * and workouts completed in the trailing 7 days.
 */
export function calculateWeeklyMetrics(
  workouts: Workout[],
  nowMs: number = Date.now(),
  minPerWeek: number = 2
): WeeklyMetrics {
  const weekMs = 7 * 86400000;
  const thisWeekWorkouts = workouts.filter((w) => {
    const t = new Date(w.start_time).getTime();
    return t <= nowMs && nowMs - t <= weekMs;
  });

  if (workouts.length === 0) {
    return {
      currentStreakWeeks: 0,
      thisWeekCount: 0,
      thisWeekWorkouts: [],
    };
  }

  let streak = 0;
  for (let w = 0; w < 52; w++) {
    const startMs = nowMs - (w + 1) * weekMs;
    const endMs = nowMs - w * weekMs;
    const countInWeek = workouts.filter((wk) => {
      const t = new Date(wk.start_time).getTime();
      return t > startMs && t <= endMs;
    }).length;

    if (countInWeek >= minPerWeek) {
      streak += 1;
    } else if (w === 0) {
      // Current rolling week may still be in progress; check prior weeks
      continue;
    } else {
      break;
    }
  }

  return {
    currentStreakWeeks: streak,
    thisWeekCount: thisWeekWorkouts.length,
    thisWeekWorkouts,
  };
}

/**
 * Formats seconds as M:SS or H:MM:SS.
 */
export function formatElapsedSeconds(totalSecs: number): string {
  const safeSecs = Math.max(0, Math.floor(totalSecs));
  const hours = Math.floor(safeSecs / 3600);
  const mins = Math.floor((safeSecs % 3600) / 60);
  const secs = safeSecs % 60;
  const mm = hours > 0 ? String(mins).padStart(2, '0') : String(mins);
  const ss = String(secs).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}
