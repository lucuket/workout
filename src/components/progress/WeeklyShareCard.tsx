'use client';

import React, { useMemo, useState } from 'react';
import { Share2, Download, Sparkles } from 'lucide-react';
import { Workout } from '@/lib/types';
import { toLocalDateKey } from '@/lib/constants';
import { calculateWeeklyMetrics } from '@/lib/workout-utils';

interface WeeklyShareCardProps {
  workouts: Workout[];
  weightUnit?: string;
  userGoal?: number;
}

export default function WeeklyShareCard({
  workouts,
  weightUnit = 'lbs',
  userGoal = 4,
}: WeeklyShareCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const { thisWeekWorkouts, totalVolume, totalMinutes, totalSets } = useMemo(() => {
    const metrics = calculateWeeklyMetrics(workouts);
    const vol = metrics.thisWeekWorkouts.reduce((sum, w) => sum + w.total_volume, 0);
    const secs = metrics.thisWeekWorkouts.reduce((sum, w) => sum + w.duration_seconds, 0);
    const sets = metrics.thisWeekWorkouts.reduce((sum, w) => sum + w.total_sets, 0);
    return {
      thisWeekWorkouts: metrics.thisWeekWorkouts,
      totalVolume: vol,
      totalMinutes: Math.round(secs / 60),
      totalSets: sets,
    };
  }, [workouts]);

  const workoutsCount = thisWeekWorkouts.length;

  const generateCanvasImage = async (): Promise<string> => {
    const canvas = document.createElement('canvas');
    const width = 800;
    const height = 800;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#09090b');
    bgGradient.addColorStop(0.5, '#121218');
    bgGradient.addColorStop(1, '#030712');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    const glow1 = ctx.createRadialGradient(700, 100, 10, 700, 100, 400);
    glow1.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
    glow1.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, width, height);

    const glow2 = ctx.createRadialGradient(100, 700, 10, 100, 700, 400);
    glow2.addColorStop(0, 'rgba(6, 182, 212, 0.15)');
    glow2.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, width - 60, height - 60);

    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('APEX', 70, 100);
    ctx.fillStyle = '#10b981';
    ctx.fillText('LIFT', 160, 100);

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#71717a';
    ctx.fillText('WEEKLY RECAP', 70, 130);

    ctx.font = '900 48px system-ui, sans-serif';
    ctx.fillStyle = '#f4f4f5';
    ctx.fillText('WEEKLY SUMMARY', 70, 200);

    ctx.font = '20px system-ui, sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText('Consistency is the only secret that works.', 70, 240);

    ctx.fillStyle = '#18181b';
    ctx.fillRect(70, 280, 660, 150);
    ctx.strokeStyle = '#3f3f46';
    ctx.lineWidth = 2;
    ctx.strokeRect(70, 280, 660, 150);

    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText('TOTAL TONNAGE LIFTED', 100, 320);

    ctx.font = '900 64px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${totalVolume.toLocaleString()} ${weightUnit}`, 100, 395);

    ctx.fillStyle = '#18181b';
    ctx.fillRect(70, 460, 200, 170);
    ctx.strokeRect(70, 460, 200, 170);
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText('WORKOUTS', 95, 500);
    ctx.font = '900 52px system-ui, sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`${workoutsCount}`, 95, 570);
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#71717a';
    ctx.fillText(`Goal: ${userGoal}/wk`, 95, 605);

    ctx.fillStyle = '#18181b';
    ctx.fillRect(300, 460, 200, 170);
    ctx.strokeRect(300, 460, 200, 170);
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText('TIME TRAINED', 325, 500);
    ctx.font = '900 52px system-ui, sans-serif';
    ctx.fillStyle = '#06b6d4';
    ctx.fillText(`${totalMinutes}`, 325, 570);
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#71717a';
    ctx.fillText('Minutes in gym', 325, 605);

    ctx.fillStyle = '#18181b';
    ctx.fillRect(530, 460, 200, 170);
    ctx.strokeRect(530, 460, 200, 170);
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillStyle = '#a1a1aa';
    ctx.fillText('TOTAL SETS', 555, 500);
    ctx.font = '900 52px system-ui, sans-serif';
    ctx.fillStyle = '#eab308';
    ctx.fillText(`${totalSets}`, 555, 570);
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#71717a';
    ctx.fillText('Completed sets', 555, 605);

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#52525b';
    ctx.fillText('Tracked with ApexLift PWA', 70, 720);

    return canvas.toDataURL('image/png');
  };

  const triggerDownload = (dataUrl: string) => {
    const link = document.createElement('a');
    link.download = `ApexLift-Weekly-Summary-${toLocalDateKey(new Date())}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleDownloadImage = async () => {
    setIsGenerating(true);
    try {
      const dataUrl = await generateCanvasImage();
      if (dataUrl) triggerDownload(dataUrl);
    } catch (err) {
      console.error('Image export failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    setIsGenerating(true);
    try {
      const dataUrl = await generateCanvasImage();
      if (!dataUrl) return;
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'weekly-summary.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Weekly Gym Summary - ApexLift',
          text: `Crushed ${totalVolume.toLocaleString()} ${weightUnit} across ${workoutsCount} workouts this week!`,
        });
      } else {
        triggerDownload(dataUrl);
      }
    } catch (err) {
      // Do not force-download when the user intentionally cancels the native share sheet
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      console.error('Share failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">
              Shareable Card
            </span>
            <h3 className="font-black text-base text-zinc-100 tracking-tight">
              Weekly Performance
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isGenerating}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active-press border border-zinc-700/60"
            title="Download PNG"
            aria-label="Download weekly summary PNG"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={isGenerating}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 active-press"
          >
            <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Share Card</span>
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-zinc-950 p-4 border border-zinc-800 space-y-3">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-mono text-emerald-400 font-bold">APEX LIFT</span>
          <span>Last 7 Days</span>
        </div>

        <div>
          <span className="text-xs text-zinc-400 font-medium">Total Volume Lifted</span>
          <div className="text-3xl font-black text-zinc-100 tracking-tight flex items-baseline gap-1 mt-0.5">
            <span>{totalVolume.toLocaleString()}</span>
            <span className="text-sm font-semibold text-emerald-400">{weightUnit}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 block">Workouts</span>
            <span className="text-lg font-black text-emerald-400">
              {workoutsCount} <span className="text-xs text-zinc-500">/{userGoal}</span>
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 block">Time</span>
            <span className="text-lg font-black text-cyan-400">{totalMinutes}m</span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800/80">
            <span className="text-[10px] text-zinc-400 block">Total Sets</span>
            <span className="text-lg font-black text-amber-400">{totalSets}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
