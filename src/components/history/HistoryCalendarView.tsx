'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  Award,
} from 'lucide-react';
import { Workout } from '@/lib/types';
import { getAllWorkouts, getUserPreferences } from '@/lib/db';
import WorkoutDetailModal from './WorkoutDetailModal';

export default function HistoryCalendarView() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [weightUnit, setWeightUnit] = useState('lbs');

  useEffect(() => {
    const load = async () => {
      const data = await getAllWorkouts();
      setWorkouts(data);
      const prefs = await getUserPreferences();
      setWeightUnit(prefs.weight_unit);
    };
    load();
  }, []);

  // Map workouts by date (YYYY-MM-DD)
  const workoutsByDate = useMemo(() => {
    const map: Record<string, Workout[]> = {};
    for (const w of workouts) {
      const d = w.start_time.split('T')[0];
      if (!map[d]) {
        map[d] = [];
      }
      map[d].push(w);
    }
    return map;
  }, [workouts]);

  // Calendar calculations
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleWorkoutClick = (w: Workout) => {
    setSelectedWorkout(w);
    setIsDetailOpen(true);
  };

  const handleWorkoutUpdated = (updated: Workout) => {
    setWorkouts((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
    setSelectedWorkout(updated);
  };

  const handleWorkoutDeleted = (id: string) => {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  };

  // Filtered workouts for the selected day or overall recent
  const displayedWorkouts = useMemo(() => {
    if (selectedDate && workoutsByDate[selectedDate]) {
      return workoutsByDate[selectedDate];
    }
    return workouts.slice(0, 20); // Recent 20 workouts if no date selected
  }, [selectedDate, workoutsByDate, workouts]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Workout History</h1>
        <p className="text-xs text-zinc-400">Calendar log & past session editor</p>
      </div>

      {/* Calendar Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base text-zinc-100">
            {monthNames[month]} {year}
          </h2>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-zinc-100 active-press"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300 hover:text-zinc-100 active-press"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-500 uppercase">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar Day Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10 rounded-xl" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const hasWorkouts = Boolean(workoutsByDate[dateStr]);
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`h-10 rounded-xl flex flex-col items-center justify-center relative transition-all active-press ${
                  isSelected
                    ? 'bg-emerald-500 text-zinc-950 font-black shadow-md ring-2 ring-emerald-400'
                    : hasWorkouts
                    ? 'bg-zinc-950 text-zinc-100 font-bold border border-zinc-800 hover:border-emerald-500/50'
                    : 'text-zinc-500 hover:bg-zinc-800/40'
                }`}
              >
                <span className="text-xs">{dayNum}</span>
                {hasWorkouts && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      isSelected ? 'bg-zinc-950' : 'bg-emerald-400'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Workouts List for Selected Date or Recent */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 px-1">
          <span>
            {selectedDate
              ? `Workouts on ${selectedDate} (${displayedWorkouts.length})`
              : `All Recent Workouts (${workouts.length})`}
          </span>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              className="text-emerald-400 hover:underline"
            >
              Show all
            </button>
          )}
        </div>

        {displayedWorkouts.length === 0 ? (
          <div className="p-8 bg-zinc-900/60 rounded-3xl border border-zinc-800 text-center text-xs text-zinc-500">
            No workouts logged for this date.
          </div>
        ) : (
          displayedWorkouts.map((w) => {
            const dur = Math.round(w.duration_seconds / 60);
            return (
              <div
                key={w.id}
                onClick={() => handleWorkoutClick(w)}
                className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer active-press transition-colors space-y-2 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {w.start_time.split('T')[0]}
                    </span>
                    <h3 className="font-bold text-base text-zinc-100">{w.name}</h3>
                  </div>

                  {w.pr_count > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                      <Award className="w-3 h-3" />
                      <span>{w.pr_count} PR</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{dur} min</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-zinc-200 font-bold">
                      {w.total_volume.toLocaleString()} {weightUnit}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Dumbbell className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{w.total_sets} sets</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Workout Detail & Editor Modal */}
      <WorkoutDetailModal
        workout={selectedWorkout}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdated={handleWorkoutUpdated}
        onDeleted={handleWorkoutDeleted}
        weightUnit={weightUnit}
      />
    </div>
  );
}
