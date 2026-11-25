'use client';

import React, { useState, useEffect } from 'react';
import { Play, Plus } from 'lucide-react';
import { Workout, RoutineTemplate } from '@/lib/types';
import {
  getActiveWorkout,
  getAllRoutines,
  startEmptyWorkout,
  startWorkoutFromRoutine,
} from '@/lib/db';
import ActiveWorkoutView from '@/components/workout/ActiveWorkoutView';

export default function WorkoutPage() {
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [routines, setRoutines] = useState<RoutineTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [active, routineList] = await Promise.all([getActiveWorkout(), getAllRoutines()]);
      setActiveWorkout(active);
      setRoutines(routineList);
      setIsLoading(false);
    };
    void load();
  }, []);

  const handleStartRoutine = async (routine: RoutineTemplate) => {
    const newWorkout = await startWorkoutFromRoutine(routine);
    setActiveWorkout(newWorkout);
  };

  const handleStartEmpty = async () => {
    const newWorkout = await startEmptyWorkout();
    setActiveWorkout(newWorkout);
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
        <span className="text-xs text-zinc-500 font-mono">Loading active session...</span>
      </div>
    );
  }

  if (activeWorkout) {
    return (
      <ActiveWorkoutView
        initialWorkout={activeWorkout}
        onFinish={() => setActiveWorkout(null)}
        onCancel={() => setActiveWorkout(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Start Workout</h1>
        <p className="text-xs text-zinc-400">Choose a routine template or start an empty session</p>
      </div>

      <button
        type="button"
        onClick={handleStartEmpty}
        className="w-full p-5 rounded-3xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 flex items-center justify-between active-press group shadow-lg"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="text-left">
            <h2 className="font-black text-base text-zinc-100">Empty Workout</h2>
            <p className="text-xs text-zinc-400">Select exercises as you train</p>
          </div>
        </div>
        <Play className="w-5 h-5 text-emerald-400 fill-emerald-400" />
      </button>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-400 px-1">
          <span>Start From Routine Template</span>
        </div>

        <div className="space-y-2.5">
          {routines.map((routine) => (
            <button
              key={routine.id}
              type="button"
              onClick={() => handleStartRoutine(routine)}
              className="w-full text-left p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 flex items-center justify-between active-press transition-colors shadow-sm"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 font-mono">
                  {routine.category || 'Split'}
                </span>
                <h3 className="font-bold text-sm text-zinc-100">{routine.name}</h3>
                <span className="text-xs text-zinc-400 block">
                  {routine.exercises.length} exercises
                </span>
              </div>

              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-md shadow-emerald-500/20 flex-shrink-0">
                <Play className="w-4 h-4 fill-zinc-950" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
