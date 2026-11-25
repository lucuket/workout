'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Play, Edit2, Trash2, Layers } from 'lucide-react';
import { RoutineTemplate } from '@/lib/types';
import {
  getAllRoutines,
  deleteRoutine,
  startEmptyWorkout,
  startWorkoutFromRoutine,
} from '@/lib/db';
import RoutineEditorModal from './RoutineEditorModal';

export default function RoutineList() {
  const router = useRouter();
  const [routines, setRoutines] = useState<RoutineTemplate[]>([]);
  const [editingRoutine, setEditingRoutine] = useState<RoutineTemplate | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const data = await getAllRoutines();
      setRoutines(data);
    };
    void load();
  }, []);

  const handleStartWorkout = async (routine: RoutineTemplate) => {
    await startWorkoutFromRoutine(routine);
    router.push('/workout');
  };

  const handleStartEmpty = async () => {
    await startEmptyWorkout();
    router.push('/workout');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this routine template?')) {
      await deleteRoutine(id);
      setRoutines((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleEdit = (routine: RoutineTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRoutine(routine);
    setIsEditorOpen(true);
  };

  const handleSaved = (saved: RoutineTemplate) => {
    setRoutines((prev) => {
      const idx = prev.findIndex((r) => r.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Routines</h1>
          <p className="text-xs text-zinc-400">Workout templates & splits</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingRoutine(null);
            setIsEditorOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 active-press"
        >
          <Plus className="w-4 h-4" />
          <span>New Routine</span>
        </button>
      </div>

      <button
        type="button"
        onClick={handleStartEmpty}
        className="w-full p-4 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-900/70 border border-zinc-800 hover:border-emerald-500/50 flex items-center justify-between active-press group transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="font-black text-sm text-zinc-100">Start Empty Workout</div>
            <div className="text-xs text-zinc-400">Log ad-hoc exercises on the fly</div>
          </div>
        </div>
        <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
      </button>

      <div className="space-y-3">
        {routines.map((routine) => (
          <div
            key={routine.id}
            className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700/80 space-y-3 shadow-md transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {routine.category || 'Split'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-zinc-100 mt-1">{routine.name}</h3>
                {routine.description && (
                  <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                    {routine.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => handleEdit(routine, e)}
                  className="p-2 rounded-lg bg-zinc-800/80 text-zinc-400 hover:text-zinc-100 active-press"
                  title="Edit Routine"
                  aria-label="Edit routine"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(routine.id, e)}
                  className="p-2 rounded-lg bg-zinc-800/80 text-zinc-400 hover:text-red-400 active-press"
                  title="Delete Routine"
                  aria-label="Delete routine"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {routine.exercises.slice(0, 5).map((ex, idx) => (
                <span
                  key={`${ex.exercise_id}-${idx}`}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-950 text-zinc-300 border border-zinc-800 truncate max-w-[140px]"
                >
                  {ex.exercise_name}
                </span>
              ))}
              {routine.exercises.length > 5 && (
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-950 text-zinc-500 font-mono">
                  +{routine.exercises.length - 5} more
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
              <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                <Layers className="w-3.5 h-3.5 text-zinc-500" />
                <span>{routine.exercises.length} exercises</span>
              </div>

              <button
                type="button"
                onClick={() => handleStartWorkout(routine)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 active-press"
              >
                <Play className="w-3.5 h-3.5 fill-zinc-950" />
                <span>Start Workout</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      <RoutineEditorModal
        routine={editingRoutine}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
