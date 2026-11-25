'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { RoutineCategory, RoutineTemplate, RoutineExerciseTemplate, Exercise } from '@/lib/types';
import { getAllExercises, saveRoutine } from '@/lib/db';
import { generateId, ROUTINE_CATEGORIES } from '@/lib/constants';
import ExercisePickerModal from '@/components/shared/ExercisePickerModal';

interface RoutineEditorModalProps {
  routine: RoutineTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (savedRoutine: RoutineTemplate) => void;
}

export default function RoutineEditorModal({
  routine,
  isOpen,
  onClose,
  onSaved,
}: RoutineEditorModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<RoutineCategory>('Push');
  const [description, setDescription] = useState('');
  const [exercises, setExercises] = useState<RoutineExerciseTemplate[]>([]);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    if (routine) {
      setName(routine.name);
      setCategory(routine.category || 'Push');
      setDescription(routine.description || '');
      setExercises(routine.exercises || []);
    } else {
      setName('');
      setCategory('Push');
      setDescription('');
      setExercises([]);
    }
  }, [routine, isOpen]);

  useEffect(() => {
    const load = async () => {
      const data = await getAllExercises();
      setAllExercises(data);
    };
    void load();
  }, []);

  if (!isOpen) return null;

  const handleAddExercise = (ex: Exercise) => {
    const newEx: RoutineExerciseTemplate = {
      exercise_id: ex.id,
      exercise_name: ex.name,
      muscle_group: ex.muscle_group,
      equipment: ex.equipment,
      order: exercises.length + 1,
      target_sets: 3,
      target_reps: '8-12',
      target_rest_seconds: 90,
    };
    setExercises((prev) => [...prev, newEx]);
    setIsPickerOpen(false);
  };

  const handleUpdateExercise = (index: number, fields: Partial<RoutineExerciseTemplate>) => {
    setExercises((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...fields } : item))
    );
  };

  const handleRemoveExercise = (index: number) => {
    setExercises((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((item, idx) => ({ ...item, order: idx + 1 }))
    );
  };

  const handleMoveExercise = (index: number, direction: -1 | 1) => {
    setExercises((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const nowIso = new Date().toISOString();
    const saved: RoutineTemplate = {
      id: routine?.id || generateId('routine'),
      name: name.trim(),
      category,
      description: description.trim() || undefined,
      exercises: exercises.map((ex, idx) => ({ ...ex, order: idx + 1 })),
      created_at: routine?.created_at || nowIso,
      updated_at: nowIso,
    };

    await saveRoutine(saved);
    onSaved(saved);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h2 className="font-bold text-base text-zinc-100">
            {routine ? 'Edit Routine' : 'New Routine Template'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100 active-press"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto space-y-4 pr-1">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1">
              Routine Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Upper Power & Hypertrophy"
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RoutineCategory)}
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
              >
                {ROUTINE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional notes"
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-200">
                Exercises ({exercises.length})
              </label>
              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 active-press"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Exercise</span>
              </button>
            </div>

            {exercises.length === 0 ? (
              <div className="p-6 bg-zinc-950 rounded-2xl border border-dashed border-zinc-800 text-center space-y-2">
                <p className="text-xs text-zinc-500">No exercises in this template yet.</p>
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-emerald-400 font-bold text-xs active-press"
                >
                  + Add First Exercise
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {exercises.map((ex, idx) => (
                  <div
                    key={`${ex.exercise_id}-${idx}`}
                    className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 text-[11px] font-mono flex items-center justify-center font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-xs text-zinc-200 truncate">
                          {ex.exercise_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMoveExercise(idx, -1)}
                            className="text-zinc-500 hover:text-zinc-200 p-1 active-press"
                            aria-label="Move up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {idx < exercises.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMoveExercise(idx, 1)}
                            className="text-zinc-500 hover:text-zinc-200 p-1 active-press"
                            aria-label="Move down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveExercise(idx)}
                          className="text-zinc-500 hover:text-red-400 p-1 active-press"
                          aria-label="Remove exercise"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-zinc-500 block">Sets</span>
                        <input
                          type="number"
                          min={1}
                          value={ex.target_sets}
                          onChange={(e) =>
                            handleUpdateExercise(idx, {
                              target_sets: Math.max(1, parseInt(e.target.value, 10) || 1),
                            })
                          }
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1 px-2 text-zinc-100 font-mono text-center font-bold"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-500 block">Reps</span>
                        <input
                          type="text"
                          value={ex.target_reps}
                          onChange={(e) =>
                            handleUpdateExercise(idx, { target_reps: e.target.value })
                          }
                          placeholder="e.g. 8-12"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1 px-2 text-zinc-100 font-mono text-center font-bold"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-500 block">Rest (s)</span>
                        <input
                          type="number"
                          min={10}
                          value={ex.target_rest_seconds}
                          onChange={(e) =>
                            handleUpdateExercise(idx, {
                              target_rest_seconds: Math.max(10, parseInt(e.target.value, 10) || 60),
                            })
                          }
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1 px-2 text-zinc-100 font-mono text-center font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-semibold text-sm active-press"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active-press"
            >
              Save Template
            </button>
          </div>
        </form>

        <ExercisePickerModal
          isOpen={isPickerOpen}
          title="Select Exercise"
          exercises={allExercises}
          onSelect={handleAddExercise}
          onClose={() => setIsPickerOpen(false)}
        />
      </div>
    </div>
  );
}
