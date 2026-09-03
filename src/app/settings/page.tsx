'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Database,
  Cloud,
  Volume2,
  Vibrate,
  Scale,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { UserPreferences } from '@/lib/types';
import {
  getUserPreferences,
  saveUserPreferences,
  seedDemoData,
  getSyncQueue,
  getDB,
} from '@/lib/db';
import { isSupabaseConfigured } from '@/lib/supabase';
import { checkAndProcessSync, getSyncState } from '@/lib/sync';

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<UserPreferences>({
    weight_unit: 'lbs',
    barbell_weight: 45,
    default_rest_seconds: 90,
    sound_enabled: true,
    haptic_enabled: true,
    theme: 'dark',
    weekly_goal_workouts: 4,
  });
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      const p = await getUserPreferences();
      setPrefs(p);
      const queue = await getSyncQueue();
      setPendingSyncCount(queue.length);
    };
    load();
  }, []);

  const handleUpdate = async (fields: Partial<UserPreferences>) => {
    const updated = await saveUserPreferences(fields);
    setPrefs(updated);
  };

  const handleReloadDemoData = async () => {
    if (
      confirm(
        'Reload 3 months of realistic workout history and 100+ seeded exercises? This will refresh your workout logs.'
      )
    ) {
      setIsSeeding(true);
      await seedDemoData(true);
      setIsSeeding(false);
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    }
  };

  const handleClearAll = async () => {
    if (confirm('Clear all local workouts and bodyweight logs? This cannot be undone.')) {
      const db = await getDB();
      await db.clear('workouts');
      await db.clear('bodyweight');
      alert('Local workout logs cleared.');
    }
  };

  const handleManualSync = async () => {
    await checkAndProcessSync();
    const queue = await getSyncQueue();
    setPendingSyncCount(queue.length);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Settings</h1>
        <p className="text-xs text-zinc-400">Preferences, cloud sync & demo data</p>
      </div>

      {/* 1. Unit & Barbell Preferences */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
        <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Scale className="w-4 h-4 text-emerald-400" />
          <span>Weight & Equipment Units</span>
        </h2>

        <div className="flex items-center justify-between py-2 border-b border-zinc-800/80">
          <div>
            <span className="text-xs font-semibold text-zinc-200 block">Default Unit</span>
            <span className="text-[11px] text-zinc-500">Pounds (lbs) or Kilograms (kg)</span>
          </div>

          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-bold">
            <button
              onClick={() => handleUpdate({ weight_unit: 'lbs', barbell_weight: 45 })}
              className={`px-3 py-1.5 rounded-lg transition-colors active-press ${
                prefs.weight_unit === 'lbs'
                  ? 'bg-emerald-500 text-zinc-950 font-black'
                  : 'text-zinc-400'
              }`}
            >
              LBS
            </button>
            <button
              onClick={() => handleUpdate({ weight_unit: 'kg', barbell_weight: 20 })}
              className={`px-3 py-1.5 rounded-lg transition-colors active-press ${
                prefs.weight_unit === 'kg'
                  ? 'bg-emerald-500 text-zinc-950 font-black'
                  : 'text-zinc-400'
              }`}
            >
              KG
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-zinc-800/80">
          <div>
            <span className="text-xs font-semibold text-zinc-200 block">Olympic Barbell Weight</span>
            <span className="text-[11px] text-zinc-500">Used in barbell plate calculations</span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {prefs.barbell_weight} {prefs.weight_unit}
          </span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-zinc-800/80">
          <div>
            <span className="text-xs font-semibold text-zinc-200 block">Default Rest Timer</span>
            <span className="text-[11px] text-zinc-500">Seconds between completed sets</span>
          </div>

          <div className="flex gap-1 text-xs">
            {[60, 90, 120, 180].map((secs) => (
              <button
                key={secs}
                onClick={() => handleUpdate({ default_rest_seconds: secs })}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] active-press ${
                  prefs.default_rest_seconds === secs
                    ? 'bg-emerald-500 text-zinc-950 font-bold'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {secs}s
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <span className="text-xs font-semibold text-zinc-200 block">Weekly Target Goal</span>
            <span className="text-[11px] text-zinc-500">Target training frequency per week</span>
          </div>

          <div className="flex gap-1 text-xs">
            {[3, 4, 5, 6].map((goal) => (
              <button
                key={goal}
                onClick={() => handleUpdate({ weekly_goal_workouts: goal })}
                className={`px-2.5 py-1 rounded-lg font-mono text-[11px] active-press ${
                  prefs.weekly_goal_workouts === goal
                    ? 'bg-emerald-500 text-zinc-950 font-bold'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {goal}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Feedback & Alerts */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
        <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-cyan-400" />
          <span>Alerts & Sound Feedback</span>
        </h2>

        <div className="flex items-center justify-between py-2 border-b border-zinc-800/80">
          <div>
            <span className="text-xs font-semibold text-zinc-200 block">Rest Timer Sound Chime</span>
            <span className="text-[11px] text-zinc-500">Plays Web Audio synthesizer ding at 0:00</span>
          </div>
          <button
            onClick={() => handleUpdate({ sound_enabled: !prefs.sound_enabled })}
            className={`w-11 h-6 rounded-full transition-colors relative active-press ${
              prefs.sound_enabled ? 'bg-emerald-500' : 'bg-zinc-800'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-zinc-950 absolute top-1 transition-transform ${
                prefs.sound_enabled ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <span className="text-xs font-semibold text-zinc-200 block">Haptic Vibration</span>
            <span className="text-[11px] text-zinc-500">Subtle vibration pulse when sets complete</span>
          </div>
          <button
            onClick={() => handleUpdate({ haptic_enabled: !prefs.haptic_enabled })}
            className={`w-11 h-6 rounded-full transition-colors relative active-press ${
              prefs.haptic_enabled ? 'bg-emerald-500' : 'bg-zinc-800'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-zinc-950 absolute top-1 transition-transform ${
                prefs.haptic_enabled ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 3. Supabase Cloud Sync Status */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-400" />
            <span>Supabase Cloud Sync</span>
          </h2>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
              isSupabaseConfigured
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
            }`}
          >
            {isSupabaseConfigured ? 'Connected' : 'Local IndexedDB Engine'}
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          {isSupabaseConfigured
            ? 'Your local IndexedDB database automatically pushes workouts and routines to your Supabase PostgreSQL cloud tables.'
            : 'Running in zero-config offline mode. All your workouts, routines, and custom exercises are saved securely in your device browser via IndexedDB.'}
        </p>

        <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-zinc-400 block">Offline Sync Queue</span>
            <span className="font-mono text-zinc-200 font-bold">
              {pendingSyncCount} operations waiting
            </span>
          </div>
          {isSupabaseConfigured && (
            <button
              onClick={handleManualSync}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 active-press"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Now</span>
            </button>
          )}
        </div>

        {!isSupabaseConfigured && (
          <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
            <strong className="text-zinc-300 block">To connect Supabase:</strong>
            <span>
              Add <code className="text-emerald-400 font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{' '}
              <code className="text-emerald-400 font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{' '}
              <code className="text-zinc-300 font-mono">.env.local</code> and run the schema in{' '}
              <code className="text-zinc-300 font-mono">supabase/schema.sql</code>.
            </span>
          </div>
        )}
      </div>

      {/* 4. Demo Data & Reset */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
        <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-400" />
          <span>Demo Data & Storage</span>
        </h2>

        <p className="text-xs text-zinc-400 leading-relaxed">
          The app includes 100+ seeded exercises and 3 months of realistic progressive overload workouts.
        </p>

        {seedSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Successfully refreshed 3-month demo dataset!</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            onClick={handleReloadDemoData}
            disabled={isSeeding}
            className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center gap-2 active-press"
          >
            <RotateCcw className={`w-4 h-4 text-amber-400 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Loading...' : 'Reload 3 Months Demo Data'}</span>
          </button>

          <button
            onClick={handleClearAll}
            className="py-2.5 px-4 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-300 text-xs font-bold flex items-center justify-center gap-2 active-press"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Workouts</span>
          </button>
        </div>
      </div>

      {/* 5. PWA Install Guide */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-3">
        <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>Install as Mobile App (PWA)</span>
        </h2>

        <div className="text-xs text-zinc-400 space-y-2 leading-relaxed">
          <p>
            <strong className="text-zinc-200">iOS (Safari):</strong> Tap the <strong>Share</strong> button{' '}
            (box with arrow pointing up) and select <strong>&quot;Add to Home Screen&quot;</strong>.
          </p>
          <p>
            <strong className="text-zinc-200">Android (Chrome):</strong> Tap the <strong>three dots</strong> menu{' '}
            in the upper right and choose <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
