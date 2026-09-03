'use client';

import React, { useEffect, useState } from 'react';
import { Timer, Plus, Minus, X, Bell } from 'lucide-react';
import { playTimerChime, triggerHaptic, sendRestCompleteNotification, requestNotificationPermission } from '@/lib/audio';

interface RestTimerProps {
  secondsRemaining: number;
  totalSeconds: number;
  exerciseName?: string;
  onAdjustTime: (deltaSeconds: number) => void;
  onSkip: () => void;
  soundEnabled?: boolean;
}

export default function RestTimer({
  secondsRemaining,
  totalSeconds,
  exerciseName,
  onAdjustTime,
  onSkip,
  soundEnabled = true,
}: RestTimerProps) {
  const [hasNotified, setHasNotified] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Ask for notification permission once when timer appears
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (secondsRemaining <= 0 && !hasNotified) {
      setHasNotified(true);
      if (soundEnabled) {
        playTimerChime();
      }
      triggerHaptic([100, 50, 100, 50, 150]);
      sendRestCompleteNotification(exerciseName);
    } else if (secondsRemaining > 0) {
      setHasNotified(false);
    }
  }, [secondsRemaining, hasNotified, soundEnabled, exerciseName]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(Math.max(0, secs) / 60);
    const rem = Math.max(0, secs) % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const progressPercent = totalSeconds > 0 ? Math.min(100, (secondsRemaining / totalSeconds) * 100) : 0;
  const isFinished = secondsRemaining <= 0;

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className={`fixed bottom-20 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-full shadow-2xl border active-press ${
          isFinished
            ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-bold animate-bounce-sm'
            : 'bg-zinc-900/95 text-zinc-100 border-zinc-700 backdrop-blur-md'
        }`}
      >
        <Timer className="w-4 h-4 text-emerald-400" />
        <span className="font-mono text-sm font-bold">{formatTime(secondsRemaining)}</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom duration-200">
      <div
        className={`rounded-2xl p-4 shadow-2xl border backdrop-blur-xl transition-all ${
          isFinished
            ? 'bg-emerald-950/95 border-emerald-500/80 shadow-emerald-500/20'
            : 'bg-zinc-900/95 border-zinc-700/80 shadow-black/80'
        }`}
      >
        {/* Progress Bar Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isFinished ? 'bg-emerald-500 text-zinc-950' : 'bg-emerald-500/20 text-emerald-400'}`}>
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-zinc-300">
                {isFinished ? 'Rest Completed!' : 'Resting'}
              </span>
              {exerciseName && (
                <span className="text-[11px] text-zinc-400 block truncate max-w-[180px]">
                  Next: {exerciseName}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(true)}
              className="px-2 py-1 text-[10px] text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 rounded-md active-press"
            >
              Minimize
            </button>
            <button
              onClick={onSkip}
              className="p-1 text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 rounded-md active-press"
              aria-label="Skip rest"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full transition-all duration-300 ${
              isFinished ? 'bg-emerald-400' : 'bg-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Timer Display & Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-black font-mono tracking-tight ${
                isFinished ? 'text-emerald-400 animate-pulse' : 'text-zinc-100'
              }`}
            >
              {formatTime(secondsRemaining)}
            </span>
            <span className="text-xs text-zinc-500">remaining</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAdjustTime(-15)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 active-press"
            >
              -15s
            </button>
            <button
              onClick={() => onAdjustTime(30)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 active-press"
            >
              +30s
            </button>
            <button
              onClick={onSkip}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold active-press ${
                isFinished
                  ? 'bg-emerald-500 text-zinc-950 shadow-md'
                  : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              }`}
            >
              {isFinished ? 'Ready' : 'Skip'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
