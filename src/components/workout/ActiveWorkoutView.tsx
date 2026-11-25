'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Plus,
  Trash2,
  Check,
  Scale,
  X,
  ArrowUp,
  ArrowDown,
  StickyNote,
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
  getUserPreferences,
} from '@/lib/db';
import { DEFAULT_PREFERENCES, generateId } from '@/lib/constants';
import {
  calculateWorkoutStats,
  countNewPRs,
  formatElapsedSeconds,
} from '@/lib/workout-utils';
import RestTimer from './RestTimer';
import PlateCalculatorModal from './PlateCalculatorModal';
import WorkoutCompleteModal from './WorkoutCompleteModal';
import ExercisePickerModal from '@/components/shared/ExercisePickerModal';
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
  const [elapsedSeconds, setElapsedSeconds] = useState(initialWorkout?.duration_seconds || 0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [pausedOffsetMs, setPausedOffsetMs] = useState(0);
  const pauseStartedAtRef = useRef<number | null>(null);
  const [showNotes, setShowNotes] = useState(Boolean(initialWorkout?.notes));
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  // Rest Timer State (timestamp-based to stay accurate across mobile screen lock)
  const [restEndTimestamp, setRestEndTimestamp] = useState<number | null>(null);
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

  // Swipe gesture state for set rows
  const [swipingSetId, setSwipingSetId] = useState<string | null>(null);
  const [swipeOffsetX, setSwipeOffsetX] = useState<number>(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Finished Workout Summary Modal
  const [completedWorkout, setCompletedWorkout] = useState<Workout | null>(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);

  // Load preferences & exercise library
  useEffect(() => {
    const load = async () => {
      const [p, ex] = await Promise.all([getUserPreferences(), getAllExercises()]);
      setPrefs(p);
      setAllExercises(ex);
    };
    void load();
  }, []);

  // Elapsed workout timer
  useEffect(() => {
    if (!workout || isTimerPaused || isCompleteModalOpen) return;

    const startTimestamp = new Date(workout.start_time).getTime();
    const updateElapsed = () => {
      const elapsedMs = Date.now() - startTimestamp - pausedOffsetMs;
      setElapsedSeconds(Math.max(0, Math.floor(elapsedMs / 1000)));
    };

    updateElapsed();
    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, [workout, isTimerPaused, pausedOffsetMs, isCompleteModalOpen]);

  // Drift-free rest timer countdown using wall-clock timestamp
  useEffect(() => {
    if (!isResting || restEndTimestamp === null) return;

    const tick = () => {
      const rem = Math.max(0, Math.ceil((restEndTimestamp - Date.now()) / 1000));
      setRestSecondsRemaining(rem);
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [isResting, restEndTimestamp]);

  // Persist active workout only when workout structure/values change (not every second!)
  const elapsedRef = useRef(elapsedSeconds);
  elapsedRef.current = elapsedSeconds;

  useEffect(() => {
    if (workout && !isCompleteModalOpen) {
      void saveActiveWorkout({
        ...workout,
        duration_seconds: elapsedRef.current,
        updated_at: new Date().toISOString(),
      });
    }
  }, [workout, isCompleteModalOpen]);

  if (!workout) {
    return null;
  }

  const handleTogglePauseTimer = () => {
    if (isTimerPaused) {
      if (pauseStartedAtRef.current !== null) {
        setPausedOffsetMs((prev) => prev + (Date.now() - pauseStartedAtRef.current!));
        pauseStartedAtRef.current = null;
      }
      setIsTimerPaused(false);
    } else {
      pauseStartedAtRef.current = Date.now();
      setIsTimerPaused(true);
    }
  };

  // Set updates (immutable)
  const handleUpdateSet = (
    exerciseIndex: number,
    setIndex: number,
    fields: Partial<WorkoutSet>
  ) => {
    setWorkout((prev) => {
      if (!prev) return null;
      const updatedExercises = prev.exercises.map((ex, idx) => {
        if (idx !== exerciseIndex) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, sIdx) => (sIdx === setIndex ? { ...s, ...fields } : s)),
        };
      });
      return { ...prev, exercises: updatedExercises };
    });
  };

  // Toggle set completion (tap or swipe right)
  const handleToggleCompleteSet = (exerciseIndex: number, setIndex: number) => {
    const exercise = workout.exercises[exerciseIndex];
    const targetSet = exercise?.sets[setIndex];
    if (!exercise || !targetSet) return;

    const newCompletedState = !targetSet.completed;

    if (prefs.haptic_enabled) {
      triggerHaptic(newCompletedState ? 20 : 10);
    }

    handleUpdateSet(exerciseIndex, setIndex, {
      completed: newCompletedState,
      completed_at: newCompletedState ? new Date().toISOString() : undefined,
    });

    if (newCompletedState) {
      const restSeconds = exercise.rest_seconds || prefs.default_rest_seconds;
      setRestTotalSeconds(restSeconds);
      setRestSecondsRemaining(restSeconds);
      setRestEndTimestamp(Date.now() + restSeconds * 1000);
      setRestExerciseName(exercise.exercise_name);
      setIsResting(true);
    }
  };

  const handleAdjustRestTime = (delta: number) => {
    setRestEndTimestamp((prevEnd) => {
      const base = Math.max(Date.now(), prevEnd ?? Date.now());
      const nextEnd = Math.max(Date.now(), base + delta * 1000);
      const nextRem = Math.max(0, Math.ceil((nextEnd - Date.now()) / 1000));
      setRestSecondsRemaining(nextRem);
      setRestTotalSeconds((prevTotal) => Math.max(prevTotal, nextRem));
      return nextEnd;
    });
  };

  // Add a new set to an exercise
  const handleAddSet = (exerciseIndex: number) => {
    setWorkout((prev) => {
      if (!prev) return null;
      const updated = prev.exercises.map((ex, idx) => {
        if (idx !== exerciseIndex) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: WorkoutSet = {
          id: generateId('set'),
          set_number: ex.sets.length + 1,
          type: 'normal',
          weight: lastSet ? lastSet.weight : 0,
          reps: lastSet ? lastSet.reps : 10,
          completed: false,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      });
      return { ...prev, exercises: updated };
    });
  };

  // Delete a set (immutable)
  const handleDeleteSet = (exerciseIndex: number, setIndex: number) => {
    setWorkout((prev) => {
      if (!prev) return null;
      const updated = prev.exercises.map((ex, idx) => {
        if (idx !== exerciseIndex) return ex;
        const filteredSets = ex.sets
          .filter((_, sIdx) => sIdx !== setIndex)
          .map((s, sIdx) => ({ ...s, set_number: sIdx + 1 }));
        return { ...ex, sets: filteredSets };
      });
      return { ...prev, exercises: updated };
    });
  };

  // Reorder exercises
  const handleMoveExercise = (exerciseIndex: number, direction: -1 | 1) => {
    setWorkout((prev) => {
      if (!prev) return null;
      const targetIndex = exerciseIndex + direction;
      if (targetIndex < 0 || targetIndex >= prev.exercises.length) return prev;
      const copy = [...prev.exercises];
      const [moved] = copy.splice(exerciseIndex, 1);
      copy.splice(targetIndex, 0, moved);
      return {
        ...prev,
        exercises: copy.map((ex, idx) => ({ ...ex, order: idx + 1 })),
      };
    });
  };

  // Add exercise from library into active workout
  const handleAddExerciseToWorkout = async (exercise: Exercise) => {
    const lastPerf = await getLastPerformanceForExercise(exercise.id);
    const defaultWeight = exercise.equipment === 'Bodyweight' ? 0 : prefs.barbell_weight;

    const newExercise: WorkoutExercise = {
      id: generateId('we'),
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      muscle_group: exercise.muscle_group,
      equipment: exercise.equipment,
      order: workout.exercises.length + 1,
      rest_seconds: prefs.default_rest_seconds,
      sets: [
        {
          id: generateId('set'),
          set_number: 1,
          type: 'normal',
          weight: lastPerf ? lastPerf.weight : defaultWeight,
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
      const filtered = prev.exercises
        .filter((_, idx) => idx !== exerciseIndex)
        .map((ex, idx) => ({ ...ex, order: idx + 1 }));
      return { ...prev, exercises: filtered };
    });
  };

  const openCalculator = (weight: number) => {
    setCalcInitialWeight(weight > 0 ? weight : prefs.weight_unit === 'kg' ? 60 : 135);
    setIsPlateCalcOpen(true);
  };

  // Finish Workout (keeps WorkoutCompleteModal mounted until user closes it!)
  const handleFinishWorkout = async () => {
    const stats = calculateWorkoutStats(workout.exercises);
    const existingPRs = await calculatePersonalRecords();
    const prCount = countNewPRs(workout.exercises, existingPRs);
    const nowIso = new Date().toISOString();

    const finished: Workout = {
      ...workout,
      end_time: nowIso,
      duration_seconds: elapsedSeconds,
      total_volume: stats.total_volume,
      total_sets: stats.total_sets,
      total_reps: stats.total_reps,
      pr_count: prCount,
      updated_at: nowIso,
      synced: false,
    };

    const saved = await saveWorkout(finished);
    await clearActiveWorkout();

    setIsResting(false);
    setRestEndTimestamp(null);
    setCompletedWorkout(saved);
    setIsCompleteModalOpen(true);
  };

  const handleCloseCompleteModal = () => {
    setIsCompleteModalOpen(false);
    if (onFinish && completedWorkout) {
      onFinish(completedWorkout);
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

  // Swipe-right gesture handlers for set rows
  const handleSetTouchStart = (setId: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    setSwipingSetId(setId);
    setSwipeOffsetX(0);
  };

  const handleSetTouchMove = (setId: string, e: React.TouchEvent) => {
    if (swipingSetId !== setId || touchStartXRef.current === null || touchStartYRef.current === null) {
      return;
    }
    const touch = e.touches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartXRef.current;
    const dy = Math.abs(touch.clientY - touchStartYRef.current);

    // Ignore vertical scrolling
    if (dy > 24 && Math.abs(dx) < dy) {
      setSwipingSetId(null);
      setSwipeOffsetX(0);
      return;
    }
    if (dx > 0) {
      setSwipeOffsetX(Math.min(84, dx));
    }
  };

  const handleSetTouchEnd = (exIdx: number, sIdx: number) => {
    if (swipeOffsetX >= 56) {
      handleToggleCompleteSet(exIdx, sIdx);
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    setSwipingSetId(null);
    setSwipeOffsetX(0);
  };

  const liveStats = calculateWorkoutStats(workout.exercises);

  return (
    <div className="space-y-4 pb-20">
      {/* Top Active Bar: Session Title + Elapsed Timer + Pause/Discard/Finish */}
      <div className="sticky top-14 z-30 bg-zinc-950/95 backdrop-blur-lg border border-zinc-800/90 rounded-2xl p-3.5 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  isTimerPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'
                }`}
              />
              <input
                type="text"
                value={workout.name}
                onChange={(e) => setWorkout((prev) => (prev ? { ...prev, name: e.target.value } : null))}
                aria-label="Workout name"
                className="font-black text-base text-zinc-100 tracking-tight leading-none bg-transparent focus:outline-none focus:border-b focus:border-emerald-500 w-full truncate"
              />
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs">
              <button
                type="button"
                onClick={handleTogglePauseTimer}
                className="inline-flex items-center gap-1 font-mono font-semibold text-emerald-400 hover:text-emerald-300 active-press"
                title={isTimerPaused ? 'Resume timer' : 'Pause timer'}
              >
                {isTimerPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                <span>{formatElapsedSeconds(elapsedSeconds)}</span>
              </button>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">{liveStats.total_sets} sets</span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-300 font-mono">
                {liveStats.total_volume.toLocaleString()} {prefs.weight_unit}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowNotes((prev) => !prev)}
              className={`p-2 rounded-xl border active-press ${
                showNotes || workout.notes
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-200'
              }`}
              title="Workout Notes"
              aria-label="Toggle workout notes"
            >
              <StickyNote className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCancelWorkout}
              className="p-2 text-zinc-500 hover:text-red-400 bg-zinc-900 rounded-xl border border-zinc-800 active-press"
              title="Discard Workout"
              aria-label="Discard workout"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleFinishWorkout}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/25 active-press flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Finish</span>
            </button>
          </div>
        </div>

        {showNotes && (
          <textarea
            rows={2}
            value={workout.notes || ''}
            onChange={(e) => setWorkout((prev) => (prev ? { ...prev, notes: e.target.value } : null))}
            placeholder="Session notes (energy, sleep, cues...)"
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
          />
        )}
      </div>

      {/* Exercises List */}
      <div className="space-y-4">
        {workout.exercises.map((exercise, exIdx) => (
          <div
            key={exercise.id}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-md space-y-3"
          >
            {/* Exercise Title Bar */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="font-bold text-base text-zinc-100 truncate">
                  {exercise.exercise_name}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] font-medium text-emerald-400/90 px-1.5 py-0.5 rounded bg-emerald-500/10">
                    {exercise.muscle_group}
                  </span>
                  <span className="text-[11px] text-zinc-400">{exercise.equipment}</span>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {(exercise.equipment === 'Barbell' || exercise.equipment === 'Smith Machine') && (
                  <button
                    type="button"
                    onClick={() => {
                      const workingSet = exercise.sets.find((s) => s.weight > 0);
                      openCalculator(workingSet?.weight || 135);
                    }}
                    className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-emerald-400 active-press border border-zinc-700/60"
                    title="Plate Calculator"
                    aria-label="Open plate calculator"
                  >
                    <Scale className="w-4 h-4" />
                  </button>
                )}

                {exIdx > 0 && (
                  <button
                    type="button"
                    onClick={() => handleMoveExercise(exIdx, -1)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 active-press"
                    title="Move up"
                    aria-label="Move exercise up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                )}
                {exIdx < workout.exercises.length - 1 && (
                  <button
                    type="button"
                    onClick={() => handleMoveExercise(exIdx, 1)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 active-press"
                    title="Move down"
                    aria-label="Move exercise down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDeleteExercise(exIdx)}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 active-press"
                  title="Remove exercise"
                  aria-label="Remove exercise"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sets Table */}
            <div className="overflow-x-auto -mx-2">
              <div className="min-w-[320px] px-2 space-y-1.5">
                <div className="grid grid-cols-12 gap-1 text-[11px] font-mono text-zinc-400 uppercase tracking-wider px-1 pb-1 border-b border-zinc-800/80">
                  <div className="col-span-2 text-center">Set</div>
                  <div className="col-span-3 text-center">Previous</div>
                  <div className="col-span-3 text-center">{prefs.weight_unit}</div>
                  <div className="col-span-2 text-center">Reps</div>
                  <div className="col-span-2 text-center">Done</div>
                </div>

                {exercise.sets.map((set, sIdx) => {
                  const isDone = set.completed;
                  const isSwiping = swipingSetId === set.id && swipeOffsetX > 0;
                  return (
                    <div
                      key={set.id}
                      onTouchStart={(e) => handleSetTouchStart(set.id, e)}
                      onTouchMove={(e) => handleSetTouchMove(set.id, e)}
                      onTouchEnd={() => handleSetTouchEnd(exIdx, sIdx)}
                      style={
                        isSwiping
                          ? { transform: `translateX(${swipeOffsetX}px)`, transition: 'none' }
                          : { transform: 'translateX(0px)', transition: 'transform 150ms ease-out' }
                      }
                      className={`grid grid-cols-12 gap-1 items-center py-1.5 px-1 rounded-xl transition-colors ${
                        isDone
                          ? 'bg-emerald-950/25 border border-emerald-900/40'
                          : isSwiping && swipeOffsetX >= 56
                          ? 'bg-emerald-500/20 border border-emerald-500/50'
                          : 'bg-zinc-950/60'
                      }`}
                    >
                      {/* Set Number & Type Pill */}
                      <div className="col-span-2 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            const types: SetType[] = ['normal', 'warmup', 'dropset', 'failure'];
                            const nextType = types[(types.indexOf(set.type) + 1) % types.length];
                            handleUpdateSet(exIdx, sIdx, { type: nextType });
                          }}
                          className={`w-8 h-8 rounded-lg text-xs font-mono font-bold flex items-center justify-center active-press ${
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
                            inputMode="decimal"
                            step="2.5"
                            value={set.weight === 0 ? '' : set.weight}
                            placeholder="0"
                            onChange={(e) =>
                              handleUpdateSet(exIdx, sIdx, {
                                weight: Math.max(0, parseFloat(e.target.value) || 0),
                              })
                            }
                            aria-label={`Set ${set.set_number} weight`}
                            className="w-full bg-transparent py-2 px-1 text-center font-bold text-sm text-zinc-100 focus:outline-none focus:bg-zinc-800"
                          />
                        </div>
                      </div>

                      {/* Reps Input */}
                      <div className="col-span-2 flex items-center justify-center">
                        <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden w-full max-w-[64px]">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={set.reps === 0 ? '' : set.reps}
                            placeholder="0"
                            onChange={(e) =>
                              handleUpdateSet(exIdx, sIdx, {
                                reps: Math.max(0, parseInt(e.target.value, 10) || 0),
                              })
                            }
                            aria-label={`Set ${set.set_number} reps`}
                            className="w-full bg-transparent py-2 px-1 text-center font-bold text-sm text-zinc-100 focus:outline-none focus:bg-zinc-800"
                          />
                        </div>
                      </div>

                      {/* Done / Swipe Complete Button */}
                      <div className="col-span-2 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => handleToggleCompleteSet(exIdx, sIdx)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active-press ${
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

            {/* Exercise Footer: Add Set / Remove Last Set */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => handleAddSet(exIdx)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 text-xs font-semibold active-press"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Add Set</span>
              </button>

              {exercise.sets.length > 1 && (
                <button
                  type="button"
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

      {/* Add Exercise Button */}
      <button
        type="button"
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
          onAdjustTime={handleAdjustRestTime}
          onSkip={() => {
            setIsResting(false);
            setRestEndTimestamp(null);
            setRestSecondsRemaining(0);
          }}
          soundEnabled={prefs.sound_enabled}
          hapticEnabled={prefs.haptic_enabled}
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
        onClose={handleCloseCompleteModal}
        weightUnit={prefs.weight_unit}
      />

      {/* Shared Exercise Library Picker Modal */}
      <ExercisePickerModal
        isOpen={isAddExerciseModalOpen}
        title="Add Exercise"
        exercises={allExercises}
        onSelect={(ex) => {
          void handleAddExerciseToWorkout(ex);
        }}
        onClose={() => setIsAddExerciseModalOpen(false)}
      />
    </div>
  );
}
