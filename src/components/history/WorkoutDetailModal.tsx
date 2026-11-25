'use client';

import React, { useEffect, useState } from 'react';
import { X, Trash2, Edit2, Plus, Clock, Dumbbell, Flame, Calendar } from 'lucide-react';
import { Workout, WorkoutExercise, WorkoutSet } from '@/lib/types';
import { saveWorkout, deleteWorkout } from '@/lib/db';
import { generateId, parseLocalDateKey, toLocalDateKey } from '@/lib/constants';
import { calculateWorkoutStats } from '@/lib/workout-utils';

interface WorkoutDetailModalProps {
  workout: Workout | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (workout: Workout) => void;
  onDeleted: (workoutId: string) => void;
  weightUnit?: string;
}

export default function WorkoutDetailModal({
  workout,
  isOpen,
  onClose,
  onUpdated,
  onDeleted,
  weightUnit = 'lbs',
}: WorkoutDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editableExercises, setEditableExercises] = useState<WorkoutExercise[]>([]);

  useEffect(() => {
    if (workout) {
      setEditName(workout.name);
      setEditNotes(workout.notes || '');
      setEditDate(toLocalDateKey(workout.start_time));
      setEditableExercises(structuredClone(workout.exercises));
      setIsEditing(false);
    }
  }, [workout, isOpen]);

  if (!isOpen || !workout) return null;

  const durationMinutes = Math.round(workout.duration_seconds / 60);

  const handleUpdateSet = (exIdx: number, sIdx: number, fields: Partial<WorkoutSet>) => {
    setEditableExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, j) => (j === sIdx ? { ...s, ...fields } : s)),
        };
      })
    );
  };

  const handleAddSet = (exIdx: number) => {
    setEditableExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: WorkoutSet = {
          id: generateId('set'),
          set_number: ex.sets.length + 1,
          type: 'normal',
          weight: lastSet ? lastSet.weight : 0,
          reps: lastSet ? lastSet.reps : 10,
          completed: true,
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      })
    );
  };

  const handleDeleteSet = (exIdx: number, sIdx: number) => {
    setEditableExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        return {
          ...ex,
          sets: ex.sets
            .filter((_, j) => j !== sIdx)
            .map((s, idx) => ({ ...s, set_number: idx + 1 })),
        };
      })
    );
  };

  const handleSaveEdits = async () => {
    const stats = calculateWorkoutStats(editableExercises);

    // Preserve original local clock time on the newly edited local date
    const originalDate = new Date(workout.start_time);
    const updatedLocalDate = parseLocalDateKey(editDate);
    if (!Number.isNaN(originalDate.getTime())) {
      updatedLocalDate.setHours(
        originalDate.getHours(),
        originalDate.getMinutes(),
        originalDate.getSeconds(),
        0
      );
    }

    const updated: Workout = {
      ...workout,
      name: editName.trim() || workout.name,
      notes: editNotes.trim() || undefined,
      start_time: updatedLocalDate.toISOString(),
      exercises: editableExercises,
      total_volume: stats.total_volume,
      total_sets: stats.total_sets,
      total_reps: stats.total_reps,
      updated_at: new Date().toISOString(),
      synced: false,
    };

    const saved = await saveWorkout(updated);
    onUpdated(saved);
    setIsEditing(false);
  };

  const handleDeleteWorkout = async () => {
    if (confirm(`Delete "${workout.name}" permanently?`)) {
      await deleteWorkout(workout.id);
      onDeleted(workout.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 border-b border-zinc-800 pb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
              <Calendar className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
              {isEditing ? (
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-0.5 text-xs text-zinc-100"
                />
              ) : (
                <span>{toLocalDateKey(workout.start_time)}</span>
              )}
            </div>
            {isEditing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1.5 w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-base font-bold text-zinc-100"
              />
            ) : (
              <h2 className="font-black text-xl text-zinc-100 mt-0.5 truncate">{workout.name}</h2>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsEditing((prev) => !prev)}
              className={`p-2 rounded-xl active-press ${
                isEditing
                  ? 'bg-emerald-500 text-zinc-950 font-bold'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-100'
              }`}
              title={isEditing ? 'Cancel edit' : 'Edit workout'}
              aria-label={isEditing ? 'Cancel edit' : 'Edit workout'}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDeleteWorkout}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-red-400 active-press"
              title="Delete workout"
              aria-label="Delete workout"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-100 active-press"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
            <Clock className="w-3.5 h-3.5 text-zinc-500 mx-auto mb-0.5" />
            <div className="text-sm font-black text-zinc-200">{durationMinutes} min</div>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
            <Flame className="w-3.5 h-3.5 text-emerald-400 mx-auto mb-0.5" />
            <div className="text-sm font-black text-emerald-400">
              {workout.total_volume.toLocaleString()} {weightUnit}
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
            <Dumbbell className="w-3.5 h-3.5 text-cyan-400 mx-auto mb-0.5" />
            <div className="text-sm font-black text-zinc-200">{workout.total_sets} sets</div>
          </div>
        </div>

        {/* Notes */}
        {isEditing ? (
          <textarea
            rows={2}
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Workout notes..."
            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
          />
        ) : (
          workout.notes && (
            <div className="px-3 py-2 bg-zinc-950/80 border border-zinc-800/80 rounded-xl text-xs text-zinc-400">
              {workout.notes}
            </div>
          )
        )}

        {/* Exercises Breakdown */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {(isEditing ? editableExercises : workout.exercises).map((ex, exIdx) => (
            <div key={ex.id || exIdx} className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-zinc-200">{ex.exercise_name}</span>
                <span className="text-[10px] text-zinc-500">{ex.muscle_group}</span>
              </div>

              <div className="space-y-1">
                {ex.sets.map((set, sIdx) => (
                  <div
                    key={set.id || sIdx}
                    className="flex items-center justify-between py-1 px-2 rounded-lg bg-zinc-900/60 text-xs font-mono"
                  >
                    <span className="text-zinc-500">Set {sIdx + 1}</span>

                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="2.5"
                            value={set.weight}
                            onChange={(e) =>
                              handleUpdateSet(exIdx, sIdx, {
                                weight: Math.max(0, parseFloat(e.target.value) || 0),
                              })
                            }
                            className="w-16 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-center font-bold text-zinc-100"
                          />
                          <span className="text-zinc-500">{weightUnit}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) =>
                              handleUpdateSet(exIdx, sIdx, {
                                reps: Math.max(0, parseInt(e.target.value, 10) || 0),
                              })
                            }
                            className="w-12 bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-center font-bold text-zinc-100"
                          />
                          <span className="text-zinc-500">reps</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSet(exIdx, sIdx)}
                          className="text-red-400 p-1"
                          aria-label="Delete set"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 font-bold text-zinc-300">
                        <span>
                          {set.weight} {weightUnit}
                        </span>
                        <span>×</span>
                        <span className="text-emerald-400">{set.reps} reps</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {isEditing && (
                <button
                  type="button"
                  onClick={() => handleAddSet(exIdx)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 pt-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Set</span>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        {isEditing ? (
          <div className="flex gap-2 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-xs active-press"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdits}
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs shadow-md active-press"
            >
              Save Changes
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-200 font-semibold text-xs active-press"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
