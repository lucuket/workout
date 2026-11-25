import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_PREFERENCES,
  formatShortLocalDate,
  parseLocalDateKey,
  toLocalDateKey,
} from '../src/lib/constants';
import { calculatePlates } from '../src/lib/plate-calculator';
import { generateRealisticHistory, SEED_EXERCISES, SEED_ROUTINES } from '../src/lib/seed-data';
import {
  calculate1RM,
  calculatePersonalRecordsFromWorkouts,
  calculateWeeklyMetrics,
  calculateWorkoutStats,
  countNewPRs,
  createWorkoutFromRoutine,
  findLastPerformanceByExercise,
  formatElapsedSeconds,
  parseTargetReps,
} from '../src/lib/workout-utils';
import { Workout } from '../src/lib/types';

describe('workout-utils', () => {
  it('calculates Epley 1RM accurately', () => {
    assert.equal(calculate1RM(0, 10), 0);
    assert.equal(calculate1RM(225, 0), 0);
    assert.equal(calculate1RM(225, 1), 225);
    assert.equal(calculate1RM(200, 10), 266.7);
  });

  it('computes workout volume, sets, and reps only from completed sets', () => {
    const stats = calculateWorkoutStats([
      {
        id: 'we-1',
        exercise_id: 'ex-bench-press',
        exercise_name: 'Barbell Bench Press',
        muscle_group: 'Chest',
        equipment: 'Barbell',
        order: 1,
        rest_seconds: 90,
        sets: [
          { id: 's1', set_number: 1, type: 'normal', weight: 135, reps: 10, completed: true },
          { id: 's2', set_number: 2, type: 'normal', weight: 185, reps: 5, completed: true },
          { id: 's3', set_number: 3, type: 'normal', weight: 225, reps: 5, completed: false },
        ],
      },
    ]);

    assert.deepEqual(stats, {
      total_volume: 2275,
      total_sets: 2,
      total_reps: 15,
    });
  });

  it('finds heaviest completed working set while skipping warmup sets', () => {
    const workouts: Workout[] = [
      {
        id: 'w-latest',
        name: 'Push Day',
        start_time: '2026-11-20T18:00:00.000Z',
        duration_seconds: 3600,
        exercises: [
          {
            id: 'we-1',
            exercise_id: 'ex-bench-press',
            exercise_name: 'Barbell Bench Press',
            muscle_group: 'Chest',
            equipment: 'Barbell',
            order: 1,
            rest_seconds: 120,
            sets: [
              { id: 's1', set_number: 1, type: 'warmup', weight: 135, reps: 10, completed: true },
              { id: 's2', set_number: 2, type: 'normal', weight: 205, reps: 8, completed: true },
              { id: 's3', set_number: 3, type: 'normal', weight: 215, reps: 6, completed: true },
            ],
          },
        ],
        total_volume: 4280,
        total_sets: 3,
        total_reps: 24,
        pr_count: 0,
        created_at: '2026-11-20T18:00:00.000Z',
        updated_at: '2026-11-20T19:00:00.000Z',
      },
    ];

    const perfs = findLastPerformanceByExercise(workouts, ['ex-bench-press', 'ex-squat']);
    assert.equal(perfs['ex-bench-press']?.weight, 215);
    assert.equal(perfs['ex-bench-press']?.reps, 6);
    assert.equal(perfs['ex-bench-press']?.sets.length, 2);
    assert.equal(perfs['ex-squat'], undefined);
  });

  it('creates workout from routine using prior per-set history and bodyweight defaults', () => {
    const pushRoutine = SEED_ROUTINES[0];
    const workout = createWorkoutFromRoutine(pushRoutine, DEFAULT_PREFERENCES, {
      'ex-bench-press': {
        weight: 225,
        reps: 6,
        sets: [
          { weight: 215, reps: 8 },
          { weight: 225, reps: 6 },
        ],
      },
    });

    assert.equal(workout.routine_id, pushRoutine.id);
    assert.equal(workout.exercises.length, pushRoutine.exercises.length);
    assert.equal(workout.exercises[0].sets[0].weight, 215);
    assert.equal(workout.exercises[0].sets[1].weight, 225);
    assert.equal(workout.exercises[0].sets[2].weight, 225); // falls back to top working set
    assert.equal(workout.exercises[0].sets[0].completed, false);
  });

  it('returns 0 streak when inactive and counts consecutive weeks accurately', () => {
    const now = new Date('2026-11-25T12:00:00.000Z').getTime();
    const dayMs = 86400000;

    assert.equal(calculateWeeklyMetrics([], now).currentStreakWeeks, 0);

    const staleOnly: Workout[] = [
      {
        id: 'w-old',
        name: 'Old Session',
        start_time: new Date(now - 35 * dayMs).toISOString(),
        duration_seconds: 1800,
        exercises: [],
        total_volume: 1000,
        total_sets: 3,
        total_reps: 30,
        pr_count: 0,
        created_at: new Date(now - 35 * dayMs).toISOString(),
        updated_at: new Date(now - 35 * dayMs).toISOString(),
      },
    ];
    assert.equal(calculateWeeklyMetrics(staleOnly, now).currentStreakWeeks, 0);

    const activeDaysAgo = [1, 3, 9, 11, 16, 18];
    const streakWorkouts: Workout[] = activeDaysAgo.map((d, idx) => ({
      id: `w-${idx}`,
      name: 'Session',
      start_time: new Date(now - d * dayMs).toISOString(),
      duration_seconds: 3000,
      exercises: [],
      total_volume: 5000,
      total_sets: 10,
      total_reps: 80,
      pr_count: 0,
      created_at: new Date(now - d * dayMs).toISOString(),
      updated_at: new Date(now - d * dayMs).toISOString(),
    }));
    const metrics = calculateWeeklyMetrics(streakWorkouts, now);
    assert.equal(metrics.thisWeekCount, 2);
    assert.equal(metrics.currentStreakWeeks, 3);
  });

  it('counts PRs against existing records and formats elapsed time', () => {
    const existing = calculatePersonalRecordsFromWorkouts([
      {
        id: 'w-1',
        name: 'Push',
        start_time: '2026-11-01T12:00:00.000Z',
        duration_seconds: 1800,
        exercises: [
          {
            id: 'we-1',
            exercise_id: 'ex-bench-press',
            exercise_name: 'Barbell Bench Press',
            muscle_group: 'Chest',
            equipment: 'Barbell',
            order: 1,
            rest_seconds: 90,
            sets: [{ id: 's1', set_number: 1, type: 'normal', weight: 200, reps: 5, completed: true }],
          },
        ],
        total_volume: 1000,
        total_sets: 1,
        total_reps: 5,
        pr_count: 0,
        created_at: '2026-11-01T12:00:00.000Z',
        updated_at: '2026-11-01T12:00:00.000Z',
      },
    ]);

    const prHit = countNewPRs(
      [
        {
          id: 'we-2',
          exercise_id: 'ex-bench-press',
          exercise_name: 'Barbell Bench Press',
          muscle_group: 'Chest',
          equipment: 'Barbell',
          order: 1,
          rest_seconds: 90,
          sets: [{ id: 's2', set_number: 1, type: 'normal', weight: 205, reps: 5, completed: true }],
        },
      ],
      existing
    );

    assert.equal(prHit, 1);
    assert.equal(parseTargetReps('8-12'), 8);
    assert.equal(formatElapsedSeconds(65), '1:05');
    assert.equal(formatElapsedSeconds(3661), '1:01:01');
  });
});

describe('plate-calculator & date helpers', () => {
  it('calculates lbs and kg barbell loads accurately', () => {
    const lbs = calculatePlates(225, 45, 'lbs');
    assert.equal(lbs.weightPerSide, 90);
    assert.deepEqual(
      lbs.platesPerSide.map((p) => [p.weight, p.count]),
      [[45, 2]]
    );
    assert.equal(lbs.remainder, 0);

    const kg = calculatePlates(102.5, 20, 'kg');
    assert.equal(kg.achievableWeight, 102.5);
    assert.equal(kg.remainder, 0);

    const underBar = calculatePlates(35, 45, 'lbs');
    assert.equal(underBar.platesPerSide.length, 0);
    assert.equal(underBar.achievableWeight, 45);
  });

  it('preserves YYYY-MM-DD local dates without UTC drift', () => {
    const key = '2026-11-25';
    const parsed = parseLocalDateKey(key);
    assert.equal(toLocalDateKey(parsed), key);
    assert.equal(formatShortLocalDate(key), '11/25');
  });
});

describe('seed data integrity', () => {
  it('ships 100+ unique seeded exercises and valid routine references', () => {
    assert.ok(SEED_EXERCISES.length >= 100, `Expected 100+ exercises, got ${SEED_EXERCISES.length}`);
    const ids = new Set(SEED_EXERCISES.map((e) => e.id));
    assert.equal(ids.size, SEED_EXERCISES.length);

    for (const routine of SEED_ROUTINES) {
      for (const ex of routine.exercises) {
        assert.ok(ids.has(ex.exercise_id), `Missing exercise ${ex.exercise_id} in ${routine.name}`);
      }
    }

    const { workouts, bodyweight } = generateRealisticHistory();
    assert.ok(workouts.length >= 35);
    assert.ok(bodyweight.length >= 40);
  });
});
