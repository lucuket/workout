'use client';

import React, { useEffect, useState } from 'react';
import { X, Trophy, Flame, Dumbbell, Calendar, Info, Trash2 } from 'lucide-react';
import { Exercise, PersonalRecord } from '@/lib/types';
import { calculatePersonalRecords, deleteCustomExercise, getAllWorkouts } from '@/lib/db';
import { toLocalDateKey } from '@/lib/constants';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: (exerciseId: string) => void;
  weightUnit?: string;
}

export default function ExerciseDetailModal({
  exercise,
  isOpen,
  onClose,
  onDeleted,
  weightUnit = 'lbs',
}: ExerciseDetailModalProps) {
  const [pr, setPr] = useState<PersonalRecord | null>(null);
  const [exerciseHistory, setExerciseHistory] = useState<
    { date: string; sets: { weight: number; reps: number }[] }[]
  >([]);

  useEffect(() => {
    if (!exercise || !isOpen) return;

    const loadData = async () => {
      const [prs, allWorkouts] = await Promise.all([
        calculatePersonalRecords(),
        getAllWorkouts(),
      ]);
      setPr(prs[exercise.id] || null);

      const historyList: { date: string; sets: { weight: number; reps: number }[] }[] = [];

      for (const w of allWorkouts) {
        const found = w.exercises.find((e) => e.exercise_id === exercise.id);
        if (found) {
          const completedSets = found.sets
            .filter((s) => s.completed)
            .map((s) => ({ weight: s.weight, reps: s.reps }));
          if (completedSets.length > 0) {
            historyList.push({
              date: toLocalDateKey(w.start_time),
              sets: completedSets,
            });
          }
        }
      }
      setExerciseHistory(historyList.slice(0, 8));
    };

    void loadData();
  }, [exercise, isOpen]);

  if (!isOpen || !exercise) return null;

  const handleDelete = async () => {
    if (!exercise.is_custom) return;
    if (confirm(`Delete custom exercise "${exercise.name}"?`)) {
      await deleteCustomExercise(exercise.id);
      if (onDeleted) onDeleted(exercise.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                {exercise.muscle_group}
              </span>
              <span className="text-xs text-zinc-400">{exercise.equipment}</span>
            </div>
            <h2 className="font-black text-xl text-zinc-100 mt-1">{exercise.name}</h2>
          </div>
          <div className="flex items-center gap-1">
            {exercise.is_custom && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-400 active-press"
                title="Delete custom exercise"
                aria-label="Delete custom exercise"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-100 active-press"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {pr ? (
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-center">
                <Dumbbell className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <div className="text-lg font-black text-zinc-100">{pr.max_weight.weight}</div>
                <div className="text-[10px] text-zinc-400 font-semibold uppercase">Max Weight ({weightUnit})</div>
              </div>
              <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-center">
                <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <div className="text-lg font-black text-amber-300">{pr.max_1rm.value}</div>
                <div className="text-[10px] text-zinc-400 font-semibold uppercase">Est. 1RM ({weightUnit})</div>
              </div>
              <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-center">
                <Flame className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                <div className="text-lg font-black text-zinc-100">{pr.max_volume.volume}</div>
                <div className="text-[10px] text-zinc-400 font-semibold uppercase">Max Set Vol</div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-center text-xs text-zinc-500">
              No personal records logged yet for this exercise.
            </div>
          )}

          {exercise.instructions && (
            <div className="bg-zinc-950/80 p-3.5 rounded-xl border border-zinc-800/80 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                <Info className="w-3.5 h-3.5 text-emerald-400" />
                <span>Form & Instructions</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{exercise.instructions}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Recent History</span>
              </div>
              <span className="text-[10px] text-zinc-500">{exerciseHistory.length} sessions logged</span>
            </div>

            {exerciseHistory.length === 0 ? (
              <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-center text-xs text-zinc-500">
                Log a workout to view history here!
              </div>
            ) : (
              <div className="space-y-1.5">
                {exerciseHistory.map((h, idx) => (
                  <div
                    key={`${h.date}-${idx}`}
                    className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs"
                  >
                    <span className="font-mono text-zinc-400 text-[11px]">{h.date}</span>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {h.sets.map((s, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/60 font-mono text-emerald-400 font-semibold text-[11px]"
                        >
                          {s.weight}×{s.reps}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-200 font-semibold text-sm hover:bg-zinc-700 active-press"
        >
          Close
        </button>
      </div>
    </div>
  );
}
