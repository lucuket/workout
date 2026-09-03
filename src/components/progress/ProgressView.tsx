'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import {
  Trophy,
  TrendingUp,
  Scale,
  Calendar,
  Plus,
  Flame,
  Dumbbell,
  Award,
} from 'lucide-react';
import {
  Workout,
  BodyweightEntry,
  Exercise,
  PersonalRecord,
} from '@/lib/types';
import {
  getAllWorkouts,
  getAllBodyweightEntries,
  logBodyweight,
  getAllExercises,
  calculatePersonalRecords,
  calculate1RM,
  getUserPreferences,
} from '@/lib/db';
import VolumeHeatmap from './VolumeHeatmap';
import WeeklyShareCard from './WeeklyShareCard';

export default function ProgressView() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [bodyweightLogs, setBodyweightLogs] = useState<BodyweightEntry[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('ex-bench-press');
  const [prs, setPrs] = useState<Record<string, PersonalRecord>>({});
  const [weightUnit, setWeightUnit] = useState('lbs');
  const [userGoal, setUserGoal] = useState(4);

  // New bodyweight input state
  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddingBw, setIsAddingBw] = useState(false);

  // Chart Metric Mode: '1rm' | 'volume' | 'max_weight'
  const [chartMetric, setChartMetric] = useState<'1rm' | 'volume' | 'max_weight'>('1rm');

  useEffect(() => {
    const load = async () => {
      const w = await getAllWorkouts();
      setWorkouts(w);

      const bw = await getAllBodyweightEntries();
      setBodyweightLogs(bw);

      const ex = await getAllExercises();
      setExercises(ex);

      const records = await calculatePersonalRecords();
      setPrs(records);

      const p = await getUserPreferences();
      setWeightUnit(p.weight_unit);
      setUserGoal(p.weekly_goal_workouts);
    };
    load();
  }, []);

  // Compute chart data for selected exercise over time
  const exerciseChartData = useMemo(() => {
    if (!selectedExerciseId || workouts.length === 0) return [];

    // Chronological order
    const sorted = [...workouts].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    const points: { date: string; fullDate: string; est1RM: number; volume: number; maxWeight: number }[] = [];

    for (const w of sorted) {
      const target = w.exercises.find((e) => e.exercise_id === selectedExerciseId);
      if (target) {
        let best1RM = 0;
        let exerciseVolume = 0;
        let maxWeight = 0;

        for (const s of target.sets) {
          if (s.completed && s.weight > 0 && s.reps > 0) {
            const e1rm = calculate1RM(s.weight, s.reps);
            if (e1rm > best1RM) best1RM = e1rm;
            if (s.weight > maxWeight) maxWeight = s.weight;
            exerciseVolume += s.weight * s.reps;
          }
        }

        if (best1RM > 0) {
          const d = new Date(w.start_time);
          const shortDate = `${d.getMonth() + 1}/${d.getDate()}`;
          points.push({
            date: shortDate,
            fullDate: w.start_time.split('T')[0],
            est1RM: Math.round(best1RM),
            volume: exerciseVolume,
            maxWeight,
          });
        }
      }
    }

    return points;
  }, [workouts, selectedExerciseId]);

  // Compute Bodyweight chart data
  const bodyweightChartData = useMemo(() => {
    return bodyweightLogs.map((entry) => {
      const d = new Date(entry.date);
      return {
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        weight: entry.weight,
        fullDate: entry.date,
      };
    });
  }, [bodyweightLogs]);

  // Quick log bodyweight
  const handleSaveBodyweight = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(newWeight);
    if (!val || val <= 0) return;

    const entry: BodyweightEntry = {
      id: `bw-${Date.now()}`,
      date: newDate,
      weight: val,
      created_at: new Date().toISOString(),
    };

    await logBodyweight(entry);
    setBodyweightLogs((prev) => [...prev, entry].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    setNewWeight('');
    setIsAddingBw(false);
  };

  const selectedExercise = exercises.find((e) => e.id === selectedExerciseId);
  const selectedPr = prs[selectedExerciseId];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Progress & Records</h1>
        <p className="text-xs text-zinc-400">Track 1RM strength, volume load, and PR trophies</p>
      </div>

      {/* 1. Weekly Shareable Card */}
      <WeeklyShareCard workouts={workouts} weightUnit={weightUnit} userGoal={userGoal} />

      {/* 2. Monthly Volume Heatmap */}
      <VolumeHeatmap workouts={workouts} weightUnit={weightUnit} />

      {/* 3. Exercise Strength Progression Chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-4">
        {/* Header & Exercise Dropdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-base text-zinc-100">Strength Progression</h2>
            </div>

            {/* Metric Toggle */}
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-[11px] font-semibold">
              <button
                onClick={() => setChartMetric('1rm')}
                className={`px-2.5 py-1 rounded-lg transition-colors active-press ${
                  chartMetric === '1rm'
                    ? 'bg-emerald-500 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                1RM
              </button>
              <button
                onClick={() => setChartMetric('volume')}
                className={`px-2.5 py-1 rounded-lg transition-colors active-press ${
                  chartMetric === 'volume'
                    ? 'bg-emerald-500 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Volume
              </button>
              <button
                onClick={() => setChartMetric('max_weight')}
                className={`px-2.5 py-1 rounded-lg transition-colors active-press ${
                  chartMetric === 'max_weight'
                    ? 'bg-emerald-500 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Max Wt
              </button>
            </div>
          </div>

          {/* Exercise Select Box */}
          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm font-semibold text-zinc-100 focus:outline-none focus:border-emerald-500"
          >
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.muscle_group})
              </option>
            ))}
          </select>
        </div>

        {/* PR Quick Highlights for this Exercise */}
        {selectedPr && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-400 font-semibold block uppercase">Est. 1RM</span>
              <span className="text-base font-black text-amber-300">
                {selectedPr.max_1rm.value} {weightUnit}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-400 font-semibold block uppercase">Heaviest</span>
              <span className="text-base font-black text-emerald-400">
                {selectedPr.max_weight.weight} {weightUnit}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-center">
              <span className="text-[10px] text-zinc-400 font-semibold block uppercase">Set Vol</span>
              <span className="text-base font-black text-cyan-400">
                {selectedPr.max_volume.volume}
              </span>
            </div>
          </div>
        )}

        {/* Recharts Curve */}
        <div className="h-60 w-full pt-2">
          {exerciseChartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500">
              No workout logs found for this exercise.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={exerciseChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} domain={['dataMin - 10', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#3f3f46',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f4f4f5',
                  }}
                  formatter={(val: any) => [
                    `${val} ${chartMetric === 'volume' ? weightUnit : weightUnit}`,
                    chartMetric === '1rm' ? 'Estimated 1RM' : chartMetric === 'volume' ? 'Volume' : 'Max Weight',
                  ]}
                  labelFormatter={(label, payload) => {
                    const item = payload[0]?.payload;
                    return item ? item.fullDate : label;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={chartMetric === '1rm' ? 'est1RM' : chartMetric === 'volume' ? 'volume' : 'maxWeight'}
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorMetric)"
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#09090b' }}
                  activeDot={{ r: 6, fill: '#34d399' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 4. Bodyweight Log & Chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-zinc-100">Bodyweight Trend</h2>
              <p className="text-[11px] text-zinc-400">
                Latest:{' '}
                <strong className="text-zinc-200">
                  {bodyweightLogs.length > 0
                    ? `${bodyweightLogs[bodyweightLogs.length - 1].weight} ${weightUnit}`
                    : 'No weigh-ins'}
                </strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddingBw(!isAddingBw)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold active-press"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Log Weight</span>
          </button>
        </div>

        {/* Quick Add Form */}
        {isAddingBw && (
          <form
            onSubmit={handleSaveBodyweight}
            className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center gap-2 animate-in fade-in"
          >
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-zinc-100 focus:outline-none"
            />
            <div className="flex-1 flex items-center bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-2">
              <input
                type="number"
                step="0.1"
                required
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder={`e.g. 175.5`}
                className="w-full bg-transparent text-xs text-zinc-100 focus:outline-none font-bold"
              />
              <span className="text-[11px] text-zinc-500 ml-1">{weightUnit}</span>
            </div>
            <button
              type="submit"
              className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 text-xs font-bold rounded-xl active-press"
            >
              Save
            </button>
          </form>
        )}

        {/* Bodyweight Chart */}
        <div className="h-52 w-full pt-2">
          {bodyweightChartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-zinc-500">
              No bodyweight data logged yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bodyweightChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#3f3f46',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val} ${weightUnit}`, 'Weight']}
                  labelFormatter={(label, payload) => payload[0]?.payload?.fullDate || label}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#06b6d4' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 5. PR Trophy Showcase */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-base text-zinc-100">PR Trophy Cabinet</h2>
            <p className="text-[11px] text-zinc-400">Top milestone personal records</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {Object.values(prs)
            .slice(0, 6)
            .map((rec) => (
              <div
                key={rec.exercise_id}
                className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-xs text-zinc-200 truncate max-w-[160px]">
                    {rec.exercise_name}
                  </h4>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {rec.max_1rm.date.split('T')[0]}
                  </span>
                </div>

                <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-sm font-black text-amber-300">
                      {rec.max_1rm.value} {weightUnit}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 block font-medium">
                    {rec.max_weight.weight} {weightUnit} × {rec.max_weight.reps} reps
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
