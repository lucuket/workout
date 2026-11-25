'use client';

import React, { useMemo } from 'react';
import { Workout } from '@/lib/types';
import { toLocalDateKey } from '@/lib/constants';

interface VolumeHeatmapProps {
  workouts: Workout[];
  weightUnit?: string;
}

export default function VolumeHeatmap({ workouts, weightUnit = 'lbs' }: VolumeHeatmapProps) {
  const heatmapData = useMemo(() => {
    const today = new Date();
    const dayMs = 86400000;
    const totalDays = 112; // 16 weeks * 7 days

    const workoutMap: Record<string, { volume: number; name: string; count: number }> = {};
    for (const w of workouts) {
      const date = toLocalDateKey(w.start_time);
      if (!workoutMap[date]) {
        workoutMap[date] = { volume: w.total_volume, name: w.name, count: 1 };
      } else {
        workoutMap[date].volume += w.total_volume;
        workoutMap[date].count += 1;
      }
    }

    let maxVolume = 1;
    for (const key in workoutMap) {
      if (workoutMap[key].volume > maxVolume) {
        maxVolume = workoutMap[key].volume;
      }
    }

    const days: {
      date: string;
      volume: number;
      count: number;
      name?: string;
      level: number;
    }[] = [];

    for (let i = totalDays - 1; i >= 0; i--) {
      const dateStr = toLocalDateKey(today.getTime() - i * dayMs);
      const entry = workoutMap[dateStr];

      if (entry && entry.volume > 0) {
        const ratio = entry.volume / maxVolume;
        let level = 1;
        if (ratio > 0.75) level = 4;
        else if (ratio > 0.5) level = 3;
        else if (ratio > 0.25) level = 2;

        days.push({
          date: dateStr,
          volume: entry.volume,
          count: entry.count,
          name: entry.name,
          level,
        });
      } else {
        days.push({
          date: dateStr,
          volume: 0,
          count: 0,
          level: 0,
        });
      }
    }

    return { days, maxVolume };
  }, [workouts]);

  const weeks = useMemo(() => {
    const cols = [];
    for (let i = 0; i < heatmapData.days.length; i += 7) {
      cols.push(heatmapData.days.slice(i, i + 7));
    }
    return cols;
  }, [heatmapData]);

  const getColorClass = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-emerald-950/80 border-emerald-900/60';
      case 2:
        return 'bg-emerald-800/90 border-emerald-700/80';
      case 3:
        return 'bg-emerald-600 border-emerald-500';
      case 4:
        return 'bg-emerald-400 border-emerald-300 shadow-sm shadow-emerald-400/50';
      default:
        return 'bg-zinc-900 border-zinc-800/80';
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-md space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-zinc-100">Workout Volume Heatmap</h3>
          <p className="text-[11px] text-zinc-400">Activity & training volume over the last 16 weeks</p>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-zinc-400">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-zinc-900 border border-zinc-800" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-950/80" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-800/90" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-600" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="flex gap-1 min-w-[340px]">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`w-3.5 h-3.5 rounded-[3px] border transition-colors ${getColorClass(
                    day.level
                  )}`}
                  title={`${day.date}: ${
                    day.volume > 0
                      ? `${day.volume.toLocaleString()} ${weightUnit} (${day.name})`
                      : 'Rest Day'
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
