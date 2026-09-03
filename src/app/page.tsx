'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Flame,
  Trophy,
  Play,
  Plus,
  ArrowRight,
  Clock,
  Dumbbell,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Workout, RoutineTemplate, UserPreferences } from '@/lib/types';
import {
  getAllWorkouts,
  getAllRoutines,
  getActiveWorkout,
  saveActiveWorkout,
  getUserPreferences,
  getLastPerformanceForExercise,
} from '@/lib/db';
import WeeklyShareCard from '@/components/progress/WeeklyShareCard';

export default function HomePage() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [routines, setRoutines] = useState<RoutineTemplate[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [prefs, setPrefs] = useState<UserPreferences>({
    weight_unit: 'lbs',
    barbell_weight: 45,
    default_rest_seconds: 90,
    sound_enabled: true,
    haptic_enabled: true,
    theme: 'dark',
    weekly_goal_workouts: 4,
  });

  useEffect(() => {
    const load = async () => {
      const w = await getAllWorkouts();
      setWorkouts(w);
      const r = await getAllRoutines();
      setRoutines(r);
      const act = await getActiveWorkout();
      setActiveWorkout(act);
      const p = await getUserPreferences();
      setPrefs(p);
    };
    load();
  }, []);

  // Compute Current Streak and Workouts this week
  const { currentStreakWeeks, thisWeekCount } = useMemo(() => {
    if (workouts.length === 0) return { currentStreakWeeks: 0, thisWeekCount: 0 };

    const now = Date.now();
    const dayMs = 86400000;
    const weekMs = 7 * dayMs;

    // Workouts in the last 7 days
    const thisWeek = workouts.filter((w) => now - new Date(w.start_time).getTime() <= weekMs);

    // Calculate consecutive weeks with at least 2 workouts
    let streak = 0;
    for (let w = 0; w < 20; w++) {
      const startMs = now - (w + 1) * weekMs;
      const endMs = now - w * weekMs;
      const countInWeek = workouts.filter((wk) => {
        const t = new Date(wk.start_time).getTime();
        return t >= startMs && t < endMs;
      }).length;

      if (countInWeek >= 2) {
        streak++;
      } else if (w > 0) {
        break;
      }
    }

    return {
      currentStreakWeeks: Math.max(1, streak),
      thisWeekCount: thisWeek.length,
    };
  }, [workouts]);

  const handleStartRoutine = async (routine: RoutineTemplate) => {
    const workoutExercises: any[] = [];
    for (let i = 0; i < routine.exercises.length; i++) {
      const re = routine.exercises[i];
      const lastPerf = await getLastPerformanceForExercise(re.exercise_id);
      const sets = Array.from({ length: re.target_sets }).map((_, sIdx) => ({
        id: `s-${Date.now()}-${i}-${sIdx}`,
        set_number: sIdx + 1,
        type: 'normal' as const,
        weight: lastPerf ? lastPerf.weight : 45,
        reps: lastPerf ? lastPerf.reps : 10,
        previous_weight: lastPerf ? lastPerf.weight : undefined,
        previous_reps: lastPerf ? lastPerf.reps : undefined,
        completed: false,
      }));

      workoutExercises.push({
        id: `we-${Date.now()}-${i}`,
        exercise_id: re.exercise_id,
        exercise_name: re.exercise_name,
        muscle_group: re.muscle_group,
        equipment: re.equipment,
        order: i + 1,
        rest_seconds: re.target_rest_seconds || prefs.default_rest_seconds,
        notes: re.notes,
        sets,
      });
    }

    const newWorkout: Workout = {
      id: `workout-${Date.now()}`,
      name: routine.name,
      routine_id: routine.id,
      start_time: new Date().toISOString(),
      duration_seconds: 0,
      exercises: workoutExercises,
      total_volume: 0,
      total_sets: 0,
      total_reps: 0,
      pr_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: false,
    };

    await saveActiveWorkout(newWorkout);
    router.push('/workout');
  };

  const handleStartEmpty = async () => {
    const newWorkout: Workout = {
      id: `workout-${Date.now()}`,
      name: 'Quick Workout',
      start_time: new Date().toISOString(),
      duration_seconds: 0,
      exercises: [],
      total_volume: 0,
      total_sets: 0,
      total_reps: 0,
      pr_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      synced: false,
    };
    await saveActiveWorkout(newWorkout);
    router.push('/workout');
  };

  const recentWorkouts = workouts.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Active Workout Resumption Card (if in progress) */}
      {activeWorkout && (
        <div className="bg-gradient-to-r from-emerald-950/80 to-zinc-900 border-2 border-emerald-500/80 rounded-3xl p-4 shadow-xl shadow-emerald-950/50 flex items-center justify-between animate-pulse-subtle">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                Session in Progress
              </span>
            </div>
            <h2 className="font-black text-lg text-zinc-100">{activeWorkout.name}</h2>
            <p className="text-xs text-zinc-400">
              {activeWorkout.exercises.length} exercises logged
            </p>
          </div>

          <Link
            href="/workout"
            className="px-4 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/30 active-press"
          >
            <span>Resume</span>
            <Play className="w-3.5 h-3.5 fill-zinc-950" />
          </Link>
        </div>
      )}

      {/* Streak & Weekly Goal Banner */}
      <div className="grid grid-cols-2 gap-3">
        {/* Streak Counter */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Flame className="w-6 h-6 fill-amber-400 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-zinc-100 leading-none flex items-baseline gap-1">
              <span>{currentStreakWeeks}</span>
              <span className="text-xs font-bold text-amber-400">Weeks</span>
            </div>
            <span className="text-[11px] text-zinc-400 font-medium block mt-1">
              Workout Streak 🔥
            </span>
          </div>
        </div>

        {/* Weekly Goal Progress */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Weekly Goal
            </span>
            <span className="text-xs font-black text-emerald-400 font-mono">
              {thisWeekCount}/{prefs.weekly_goal_workouts}
            </span>
          </div>

          {/* Mini progress bar */}
          <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden my-2">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (thisWeekCount / prefs.weekly_goal_workouts) * 100)}%`,
              }}
            />
          </div>

          <span className="text-[11px] text-zinc-400 truncate">
            {thisWeekCount >= prefs.weekly_goal_workouts
              ? 'Target crushed! 💪'
              : `${prefs.weekly_goal_workouts - thisWeekCount} workouts left`}
          </span>
        </div>
      </div>

      {/* Quick Start Workouts Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base text-zinc-100 flex items-center gap-2">
            <span>Quick Start</span>
          </h2>
          <Link
            href="/routines"
            className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>All Routines</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Quick Start Empty Card */}
        <button
          onClick={handleStartEmpty}
          className="w-full p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500/40 flex items-center justify-between active-press transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="text-left">
              <div className="font-black text-sm text-zinc-100">Start Empty Workout</div>
              <div className="text-xs text-zinc-400">Build session on the fly</div>
            </div>
          </div>
          <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
        </button>

        {/* Preset Routine Carousel / Quick Cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {routines.slice(0, 4).map((routine) => (
            <button
              key={routine.id}
              onClick={() => handleStartRoutine(routine)}
              className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 text-left active-press transition-all flex flex-col justify-between h-28"
            >
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400 font-mono">
                  {routine.category || 'Split'}
                </span>
                <h3 className="font-bold text-xs text-zinc-100 line-clamp-2 mt-1.5">
                  {routine.name}
                </h3>
              </div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                <span>{routine.exercises.length} exercises</span>
                <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Shareable Weekly Summary Card */}
      <WeeklyShareCard
        workouts={workouts}
        weightUnit={prefs.weight_unit}
        userGoal={prefs.weekly_goal_workouts}
      />

      {/* Recent Activity Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base text-zinc-100">Recent Workouts</h2>
          <Link
            href="/history"
            className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Calendar View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {recentWorkouts.map((w) => {
            const dur = Math.round(w.duration_seconds / 60);
            return (
              <Link
                key={w.id}
                href="/history"
                className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between active-press transition-colors block"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-zinc-100">{w.name}</h3>
                    {w.pr_count > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {w.pr_count} PR
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="font-mono text-zinc-500">
                      {w.start_time.split('T')[0]}
                    </span>
                    <span>•</span>
                    <span>{dur} min</span>
                    <span>•</span>
                    <span className="text-zinc-300 font-bold">
                      {w.total_volume.toLocaleString()} {prefs.weight_unit}
                    </span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-zinc-500" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
