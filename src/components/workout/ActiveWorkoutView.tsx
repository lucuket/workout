'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Plus,
  Trash2,
  Check,
  Scale,
  Timer,
  ChevronDown,
  X,
  MoreVertical,
  Dumbbell,
  AlertCircle,
} from 'lucide-react';
import {
  Workout,
  WorkoutExercise,
  WorkoutSet,
  SetType,
  Exercise,
  UserPreferences,
} from '@/lib/types';
import {
  saveActiveWorkout,
  clearActiveWorkout,
  saveWorkout,
  getAllExercises,
  getLastPerformanceForExercise,
  calculatePersonalRecords,
  calculate1RM,
  getUserPreferences,
} from '@/lib/db';
import RestTimer from './RestTimer';
import PlateCalculatorModal from './PlateCalculatorModal';
import WorkoutCompleteModal from './WorkoutCompleteModal';
import { triggerHaptic } from '@/lib/audio';

interface ActiveWorkoutViewProps {
  initialWorkout?: Workout | null;
  onFinish?: (finishedWorkout: Workout) => void;
  onCancel?: () => void;
}

export default function ActiveWorkoutView({
  initialWorkout,
  onFinish,
  onCancel,
}: ActiveWorkoutViewProps) {
  const [workout, setWorkout] = useState<Workout | null>(initialWorkout || null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [prefs, setPrefs] = useState<UserPreferences>({
    weight_unit: 'lbs',
    barbell_weight: 45,
    default_rest_seconds: 90,
    sound_enabled: true,
    haptic_enabled: true,
    theme: 'dark',
    weekly_goal_workouts: 4,
  });

  // Rest Timer State
  const [restSecondsRemaining, setRestSecondsRemaining] = useState<number>(0);
  const [restTotalSeconds, setRestTotalSeconds] = useState<number>(0);
  const [restExerciseName, setRestExerciseName] = useState<string>('');
  const [isResting, setIsResting] = useState<boolean>(false);

  // Plate Calculator State
  const [isPlateCalcOpen, setIsPlateCalcOpen] = useState(false);
  const [calcInitialWeight, setCalcInitialWeight] = useState(135);

  // Add Exercise Library Modal State
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');

  // Finished Workout Summary Modal
  const [completedWorkout, setCompletedWorkout] = useState<Workout | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  // Initialize preferences & exercises
  useEffect(() => {
    const load = async () => {
      const p = await getUserPreferences();
      setPrefs(p);
      const ex = await getAllExercises();
      setAllExercises(ex);
    };
    load();
  }, []);

  // Elapsed workout timer
  useEffect(() => {
    if (!workout || isTimerPaused) return;

    const startTimestamp = new Date(workout.start_time).getTime();
    const updateElapsed = () => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startTimestamp) / 1000)));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [workout?.start_time, isTimerPaused]);

  // Rest timer countdown
  useEffect(() => {
    if (!isResting || restSecondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setRestSecondsRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isResting, restSecondsRemaining]);

  // Persist active workout on every change
  useEffect(() => {
    if (workout) {
      saveActiveWorkout({ ...workout, duration_seconds: elapsedSeconds });
    }
  }, [workout, elapsedSeconds]);

  if (!workout) {
    return null;
  }

  // Set updates
  const handleUpdateSet = (
    exerciseIndex: number,
    setIndex: number,
    fields: Partial<WorkoutSet>
  ) => {
    setWorkout((prev) => {
      if (!prev) return null;
      const updatedExercises = [...prev.exercises];
      const targetExercise = { ...updatedExercises[exerciseIndex] };
      const updatedSets = [...targetExercise.sets];
      updatedSets[setIndex] = { ...updatedSets[setIndex], ...fields };
      targetExercise.sets = updatedSets;
      updatedExercises[exerciseIndex] = targetExercise;
      return { ...prev, exercises: updatedExercises };
    });
  };

  // Toggle set completion (swipe or tap check)
  const handleToggleCompleteSet = (exerciseIndex: number, setIndex: number) => {
    if (!workout) return;
    const targetSet = workout.exercises[exerciseIndex].sets[setIndex];
    const newCompletedState = !targetSet.completed;

    if (prefs.haptic_enabled) {
      triggerHaptic(newCompletedState ? 20 : 10);
    }

    handleUpdateSet(exerciseIndex, setIndex, {
      completed: newCompletedState,
      completed_at: newCompletedState ? new Date().toISOString() : undefined,
    });

    // Start rest timer automatically when set completed
    if (newCompletedState) {
      const exercise = workout.exercises[exerciseIndex];
      const restSeconds = exercise.rest_seconds || prefs.default_rest_seconds;
      setRestTotalSeconds(restSeconds);
      setRestSecondsRemaining(restSeconds);
      setRestExerciseName(exercise.exercise_name);
      setIsResting(true);
    }
  };

  // Add a new set to an exercise
  const handleAddSet = (exerciseIndex: number) => {
    if (!workout) return;
    const exercise = workout.exercises[exerciseIndex];
    const lastSet = exercise.sets[exercise.sets.length - 1];

    const newSet: WorkoutSet = {
      id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      set_number: exercise.sets.length + 1,
      type: 'normal',
      weight: lastSet ? lastSet.weight : 0,
      reps: lastSet ? lastSet.reps : 10,
      completed: false,
    };

    setWorkout((prev) => {
      if (!prev) return null;
      const updated = [...prev.exercises];
      updated[exerciseIndex] = {
        ...updated[exerciseIndex],
        sets: [...updated[exerciseIndex].sets, newSet],
      };
      return { ...prev, exercises: updated };
    });
  };

  // Delete a set
  const handleDeleteSet = (exerciseIndex: number, setIndex: number) => {
    setWorkout((prev) => {
      if (!prev) return null;
      const updated = [...prev.exercises];
      const ex = updated[exerciseIndex];
      const filteredSets = ex.sets.filter((_, idx) => idx !== setIndex);
      // Re-index set numbers
      ex.sets = filteredSets.map((s, idx) => ({ ...s, set_number: idx + 1 }));
      return { ...prev, exercises: updated };
    });
  };

  // Add exercise from library into active workout
  const handleAddExerciseToWorkout = async (exercise: Exercise) => {
    if (!workout) return;

    // Check for previous performance to auto-fill
    const lastPerf = await getLastPerformanceForExercise(exercise.id);

    const newExercise: WorkoutExercise = {
      id: `we-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      muscle_group: exercise.muscle_group,
      equipment: exercise.equipment,
      order: workout.exercises.length + 1,
      rest_seconds: prefs.default_rest_seconds,
      sets: [
        {
          id: `s-${Date.now()}-1`,
          set_number: 1,
          type: 'normal',
          weight: lastPerf ? lastPerf.weight : 45,
          reps: lastPerf ? lastPerf.reps : 10,
          previous_weight: lastPerf ? lastPerf.weight : undefined,
          previous_reps: lastPerf ? lastPerf.reps : undefined,
          completed: false,
        },
      ],
    };

    setWorkout((prev) => {
      if (!prev) return null;
      return { ...prev, exercises: [...prev.exercises, newExercise] };
    });

    setIsAddExerciseModalOpen(false);
  };

  // Delete exercise from active workout
  const handleDeleteExercise = (exerciseIndex: number) => {
    setWorkout((prev) => {
      if (!prev) return null;
      const filtered = prev.exercises.filter((_, idx) => idx !== exerciseIndex);
      return { ...prev, exercises: filtered };
    });
  };

  // Open plate calculator with set weight
  const openCalculator = (weight: number) => {
    setCalcInitialWeight(weight > 0 ? weight : 135);
    setIsPlateCalcOpen(true);
  };

  // Finish Workout
  const handleFinishWorkout = async () => {
    if (!workout) return;

    let totalVolume = 0;
    let totalSets = 0;
    let totalReps = 0;

    for (const ex of workout.exercises) {
      for (const set of ex.sets) {
        if (set.completed) {
          totalSets++;
          totalReps += set.reps;
          totalVolume += set.weight * set.reps;
        }
      }
    }

    // Detect new PRs achieved during this workout
    const currentPRs = await calculatePersonalRecords();
    let prCount = 0;

    for (const ex of workout.exercises) {
      for (const set of ex.sets) {
        if (!set.completed || set.weight <= 0) continue;
        const est1RM = calculate1RM(set.weight, set.reps);
        const existing = currentPRs[ex.exercise_id];
        if (!existing || set.weight > existing.max_weight.weight || est1RM > existing.max_1rm.value) {
          prCount++;
          break; // Count at most 1 PR per exercise in summary badge
        }
      }
    }

    const finished: Workout = {
      ...workout,
      end_time: new Date().toISOString(),
      duration_seconds: elapsedSeconds,
      total_volume: totalVolume,
      total_sets: totalSets,
      total_reps: totalReps,
      pr_count: prCount,
      updated_at: new Date().toISOString(),
      synced: false,
    };

    await saveWorkout(finished);
    await clearActiveWorkout();

    setCompletedWorkout(finished);
    setIsCompleteModalOpen(true);
    setIsResting(false);

    if (onFinish) {
      onFinish(finished);
    }
  };

  // Cancel / Discard workout
  const handleCancelWorkout = async () => {
    if (confirm('Are you sure you want to discard this workout? All progress will be lost.')) {
      await clearActiveWorkout();
      if (onCancel) {
        onCancel();
      }
    }
  };

  const formatElapsed = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Active Bar: Session Title + Elapsed Timer + Finish Button */}
      <div className="sticky top-14 z-30 bg-zinc-950/95 backdrop-blur-lg border border-zinc-800/90 rounded-2xl p-3.5 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <h1 className="font-black text-lg text-zinc-100 tracking-tight leading-none truncate max-w-[180px]">
              {workout.name}
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-xs font-semibold text-emerald-400">
              ⏱️ {formatElapsed(elapsedSeconds)}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-zinc-400">
              {workout.exercises.length} exercises
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCancelWorkout}
            className="p-2 text-zinc-500 hover:text-red-400 bg-zinc-900 rounded-xl border border-zinc-800 active-press"
            title="Discard Workout"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleFinishWorkout}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/25 active-press flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Finish</span>
          </button>
        </div>
      </div>

      {/* Exercises List */}
      <div className="space-y-4">
        {workout.exercises.map((exercise, exIdx) => (
          <div
            key={exercise.id}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-md space-y-3"
          >
            {/* Exercise Title Bar */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold text-base text-zinc-100 flex items-center gap-1.5">
                  <span>{exercise.exercise_name}</span>
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-medium text-emerald-400/90 px-1.5 py-0.5 rounded bg-emerald-500/10">
                    {exercise.muscle_group}
                  </span>
                  <span className="text-[11px] text-zinc-400">{exercise.equipment}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Plate calculator shortcut for barbells */}
                {(exercise.equipment === 'Barbell' || exercise.equipment === 'Smith Machine') && (
                  <button
                    onClick={() => {
                      const firstSetWeight = exercise.sets[0]?.weight || 135;
                      openCalculator(firstSetWeight);
                    }}
                    className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-emerald-400 active-press border border-zinc-700/60"
                    title="Plate Calculator"
                  >
                    <Scale className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => handleDeleteExercise(exIdx)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 active-press"
                  title="Remove exercise"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sets Table */}
            <div className="overflow-x-auto -mx-2">
              <div className="min-w-[320px] px-2 space-y-1.5">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-1 text-[11px] font-mono text-zinc-400 uppercase tracking-wider px-1 pb-1 border-b border-zinc-800/80">
                  <div className="col-span-2 text-center">Set</div>
                  <div className="col-span-3 text-center">Previous</div>
                  <div className="col-span-3 text-center">Weight</div>
                  <div className="col-span-2 text-center">Reps</div>
                  <div className="col-span-2 text-center">Done</div>
                </div>

                {/* Set Rows */}
                {exercise.sets.map((set, sIdx) => {
                  const isDone = set.completed;
                  return (
                    <div
                      key={set.id}
                      className={`grid grid-cols-12 gap-1 items-center py-1.5 px-1 rounded-xl transition-colors ${
                        isDone ? 'bg-emerald-950/25 border border-emerald-900/40' : 'bg-zinc-950/60'
                      }`}
                    >
                      {/* Set Number & Type Pill */}
                      <div className="col-span-2 flex items-center justify-center">
                        <button
                          onClick={() => {
                            // Cycle through set types: normal -> warmup -> dropset -> failure -> normal
                            const types: SetType[] = ['normal', 'warmup', 'dropset', 'failure'];
                            const nextType = types[(types.indexOf(set.type) + 1) % types.length];
                            handleUpdateSet(exIdx, sIdx, { type: nextType });
                          }}
                          className={`w-7 h-7 rounded-lg text-xs font-mono font-bold flex items-center justify-center active-press ${
                            set.type === 'warmup'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : set.type === 'dropset'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : set.type === 'failure'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                          title={`Type: ${set.type} (tap to change)`}
                        >
                          {set.type === 'warmup'
                            ? 'W'
                            : set.type === 'dropset'
                            ? 'D'
                            : set.type === 'failure'
                            ? 'F'
                            : set.set_number}
                        </button>
                      </div>

                      {/* Previous Performance Auto-Fill Display */}
                      <div className="col-span-3 text-center text-xs font-mono text-zinc-400 truncate">
                        {set.previous_weight !== undefined
                          ? `${set.previous_weight}×${set.previous_reps || '-'}`
                          : '—'}
                      </div>

                      {/* Weight Input */}
                      <div className="col-span-3 flex items-center justify-center">
                        <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden w-full max-w-[84px]">
                          <input
                            type="number"
                            step="2.5"
                            value={set.weight === 0 ? '' : set.weight}
                            placeholder="0"
                            onChange={(e) =>
                              handleUpdateSet(exIdx, sIdx, {
                                weight: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-full bg-transparent py-1.5 px-1 text-center font-bold text-sm text-zinc-100 focus:outline-none focus:bg-zinc-800"
                          />
                        </div>
                      </div>

                      {/* Reps Input */}
                      <div className="col-span-2 flex items-center justify-center">
                        <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden w-full max-w-[64px]">
                          <input
                            type="number"
                            value={set.reps === 0 ? '' : set.reps}
                            placeholder="0"
                            onChange={(e) =>
                              handleUpdateSet(exIdx, sIdx, {
                                reps: parseInt(e.target.value, 10) || 0,
                              })
                            }
                            className="w-full bg-transparent py-1.5 px-1 text-center font-bold text-sm text-zinc-100 focus:outline-none focus:bg-zinc-800"
                          />
                        </div>
                      </div>

                      {/* Done / Swipe Complete Button */}
                      <div className="col-span-2 flex items-center justify-center">
                        <button
                          onClick={() => handleToggleCompleteSet(exIdx, sIdx)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active-press ${
                            isDone
                              ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-400/40'
                              : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200'
                          }`}
                          aria-label={isDone ? 'Mark set incomplete' : 'Complete set'}
                        >
                          <Check className={`w-4 h-4 ${isDone ? 'stroke-[3]' : 'stroke-2'}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Exercise Footer: Add Set Button */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => handleAddSet(exIdx)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold active-press"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Add Set</span>
              </button>

              {exercise.sets.length > 1 && (
                <button
                  onClick={() => handleDeleteSet(exIdx, exercise.sets.length - 1)}
                  className="text-xs text-zinc-500 hover:text-red-400 py-1 px-2"
                >
                  Remove last set
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Exercise Floating / Full-width Button */}
      <button
        onClick={() => setIsAddExerciseModalOpen(true)}
        className="w-full py-3.5 rounded-2xl border-2 border-dashed border-zinc-700/80 hover:border-emerald-500/50 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-300 font-bold text-sm flex items-center justify-center gap-2 active-press transition-colors"
      >
        <Plus className="w-4 h-4 text-emerald-400" />
        <span>Add Exercise</span>
      </button>

      {/* Rest Timer Floating Component */}
      {isResting && (
        <RestTimer
          secondsRemaining={restSecondsRemaining}
          totalSeconds={restTotalSeconds}
          exerciseName={restExerciseName}
          onAdjustTime={(delta) =>
            setRestSecondsRemaining((prev) => Math.max(0, prev + delta))
          }
          onSkip={() => {
            setIsResting(false);
            setRestSecondsRemaining(0);
          }}
          soundEnabled={prefs.sound_enabled}
        />
      )}

      {/* Plate Calculator Modal */}
      <PlateCalculatorModal
        isOpen={isPlateCalcOpen}
        onClose={() => setIsPlateCalcOpen(false)}
        initialWeight={calcInitialWeight}
        unit={prefs.weight_unit}
        defaultBarWeight={prefs.barbell_weight}
      />

      {/* Workout Complete Celebration Modal */}
      <WorkoutCompleteModal
        isOpen={isCompleteModalOpen}
        workout={completedWorkout}
        onClose={() => setIsCompleteModalOpen(false)}
        weightUnit={prefs.weight_unit}
      />

      {/* Modal: Select Exercise from Library */}
      {isAddExerciseModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="flex-1 max-w-lg mx-auto w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h2 className="font-bold text-base text-zinc-100">Add Exercise</h2>
              <button
                onClick={() => setIsAddExerciseModalOpen(false)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100 active-press"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="pt-3 pb-2">
              <input
                type="text"
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                placeholder="Search 100+ exercises..."
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/60 -mx-2 px-2">
              {allExercises
                .filter(
                  (ex) =>
                    ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
                    ex.muscle_group.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
                    ex.equipment.toLowerCase().includes(exerciseSearch.toLowerCase())
                )
                .map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => handleAddExerciseToWorkout(ex)}
                    className="w-full py-3 px-2 flex items-center justify-between text-left hover:bg-zinc-800/60 rounded-xl active-press transition-colors"
                  >
                    <div>
                      <span className="font-bold text-sm text-zinc-100 block">{ex.name}</span>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
                        <span className="text-emerald-400">{ex.muscle_group}</span>
                        <span>•</span>
                        <span>{ex.equipment}</span>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-emerald-400" />
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
