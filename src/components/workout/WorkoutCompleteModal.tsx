'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, CheckCircle2, Flame, Clock, Dumbbell, Award, ArrowRight } from 'lucide-react';
import { Workout } from '@/lib/types';
import Link from 'next/link';

interface WorkoutCompleteModalProps {
  workout: Workout | null;
  isOpen: boolean;
  onClose: () => void;
  weightUnit?: string;
}

export default function WorkoutCompleteModal({
  workout,
  isOpen,
  onClose,
  weightUnit = 'lbs',
}: WorkoutCompleteModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Trigger festive confetti explosion
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#eab308', '#ffffff'],
      });
    }
  }, [isOpen]);

  if (!isOpen || !workout) return null;

  const durationMinutes = Math.max(1, Math.round(workout.duration_seconds / 60));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 shadow-2xl space-y-6 text-center">
        {/* Big Celebration Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Trophy className="w-8 h-8 stroke-[2.5]" />
        </div>

        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
            Workout Completed
          </span>
          <h2 className="text-2xl font-black text-zinc-100 tracking-tight mt-0.5">
            {workout.name}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Phenomenal effort. Every single rep counts.
          </p>
        </div>

        {/* PR Badge Highlight if any PRs achieved */}
        {workout.pr_count > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-center gap-2 text-amber-300">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold">
              {workout.pr_count} New Personal Record{workout.pr_count > 1 ? 's' : ''} Hit!
            </span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/80 flex flex-col items-center">
            <Clock className="w-4 h-4 text-zinc-400 mb-1" />
            <span className="text-2xl font-black text-zinc-100">{durationMinutes}</span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Minutes</span>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/80 flex flex-col items-center">
            <Flame className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-2xl font-black text-emerald-400">
              {workout.total_volume.toLocaleString()}
            </span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">
              Volume ({weightUnit})
            </span>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/80 flex flex-col items-center">
            <Dumbbell className="w-4 h-4 text-cyan-400 mb-1" />
            <span className="text-2xl font-black text-zinc-100">{workout.total_sets}</span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Sets Completed</span>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800/80 flex flex-col items-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mb-1" />
            <span className="text-2xl font-black text-zinc-100">{workout.total_reps}</span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Total Reps</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/progress"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active-press"
          >
            <span>View Progress & Charts</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 font-semibold text-sm active-press"
          >
            Close & Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
