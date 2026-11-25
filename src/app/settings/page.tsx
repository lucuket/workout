'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Cloud,
  Volume2,
  Scale,
  RotateCcw,
  CheckCircle2,
  Smartphone,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  LogIn,
  LogOut,
  CloudDownload,
} from 'lucide-react';
import { BackupDataBundle, UserPreferences } from '@/lib/types';
import {
  getUserPreferences,
  saveUserPreferences,
  seedDemoData,
  getSyncQueue,
  getDB,
  exportBackupData,
  importBackupData,
} from '@/lib/db';
import { DEFAULT_PREFERENCES, toLocalDateKey } from '@/lib/constants';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { checkAndProcessSync, pullFromSupabase, subscribeSyncState } from '@/lib/sync';

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSeeding, setIsSeeding] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Supabase Auth State (only used when NEXT_PUBLIC_SUPABASE_* env vars are configured)
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [isSyncBusy, setIsSyncBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const load = async () => {
      const [p, queue] = await Promise.all([getUserPreferences(), getSyncQueue()]);
      setPrefs(p);
      setPendingSyncCount(queue.length);

      const supabase = getSupabase();
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setSignedInEmail(user?.email || null);
      }
    };
    void load();

    const unsub = subscribeSyncState((_status, count) => {
      setPendingSyncCount(count);
    });
    return unsub;
  }, []);

  const flashStatus = (msg: string) => {
    setErrorMessage(null);
    setStatusMessage(msg);
    window.setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleUpdate = async (fields: Partial<UserPreferences>) => {
    const updated = await saveUserPreferences(fields);
    setPrefs(updated);
  };

  const handleReloadDemoData = async () => {
    if (
      confirm(
        'Reload 3 months of realistic workout history and 100+ seeded exercises? This will replace your current local logs.'
      )
    ) {
      setIsSeeding(true);
      await seedDemoData(true);
      setIsSeeding(false);
      flashStatus('Successfully refreshed 3-month demo dataset!');
    }
  };

  const handleClearAll = async () => {
    if (confirm('Clear all local workouts and bodyweight logs? This cannot be undone.')) {
      const db = await getDB();
      await db.clear('workouts');
      await db.clear('bodyweight');
      flashStatus('Local workout and bodyweight logs cleared.');
    }
  };

  const handleExportBackup = async () => {
    try {
      const bundle = await exportBackupData();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `apexlift-backup-${toLocalDateKey(new Date())}.json`;
      link.click();
      URL.revokeObjectURL(url);
      flashStatus('Exported local backup JSON file.');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to export backup.');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as BackupDataBundle;
      await importBackupData(parsed);
      const updatedPrefs = await getUserPreferences();
      setPrefs(updatedPrefs);
      flashStatus(`Imported ${parsed.workouts?.length || 0} workouts from backup.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to parse backup file.');
    } finally {
      e.target.value = '';
    }
  };

  const handleManualSync = async () => {
    setIsSyncBusy(true);
    await checkAndProcessSync();
    const queue = await getSyncQueue();
    setPendingSyncCount(queue.length);
    setIsSyncBusy(false);
    flashStatus(queue.length === 0 ? 'All queued changes synced.' : `${queue.length} operations still pending.`);
  };

  const handlePullCloud = async () => {
    setIsSyncBusy(true);
    const ok = await pullFromSupabase();
    setIsSyncBusy(false);
    if (ok) {
      flashStatus('Pulled latest records from Supabase.');
    } else {
      setErrorMessage('Sign in while online to pull cloud records.');
    }
  };

  const handleSignIn = async (mode: 'signin' | 'signup') => {
    const supabase = getSupabase();
    if (!supabase || !authEmail.trim() || !authPassword) return;
    setIsAuthBusy(true);
    setErrorMessage(null);
    try {
      const res =
        mode === 'signin'
          ? await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword })
          : await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword });

      if (res.error) {
        setErrorMessage(res.error.message);
      } else {
        setSignedInEmail(res.data.user?.email || authEmail.trim());
        setAuthPassword('');
        await checkAndProcessSync();
        await pullFromSupabase();
        flashStatus(
          mode === 'signin'
            ? 'Signed in and synchronized with Supabase.'
            : 'Account created! Check email if confirmation is enabled.'
        );
      }
    } finally {
      setIsAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    setSignedInEmail(null);
    flashStatus('Signed out of Supabase. Local IndexedDB data remains on device.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Settings</h1>
        <p className="text-xs text-zinc-400">Preferences, cloud sync & backups</p>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold">
          {errorMessage}
        </div>
      )}

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
              type="button"
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
              type="button"
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
                type="button"
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
                type="button"
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
            type="button"
            role="switch"
            aria-checked={prefs.sound_enabled}
            aria-label="Toggle rest timer sound chime"
            onClick={() => handleUpdate({ sound_enabled: !prefs.sound_enabled })}
            className={`w-11 h-6 rounded-full transition-colors relative active-press ${
              prefs.sound_enabled ? 'bg-emerald-500' : 'bg-zinc-800'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-zinc-950 absolute top-1 transition-all ${
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
            type="button"
            role="switch"
            aria-checked={prefs.haptic_enabled}
            aria-label="Toggle haptic vibration"
            onClick={() => handleUpdate({ haptic_enabled: !prefs.haptic_enabled })}
            className={`w-11 h-6 rounded-full transition-colors relative active-press ${
              prefs.haptic_enabled ? 'bg-emerald-500' : 'bg-zinc-800'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-zinc-950 absolute top-1 transition-all ${
                prefs.haptic_enabled ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 3. Supabase Cloud Sync & Auth */}
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
            {isSupabaseConfigured ? 'Configured' : 'Local IndexedDB Engine'}
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          {isSupabaseConfigured
            ? 'Sign in with your Supabase account to sync queued offline workouts and routines to your RLS-protected PostgreSQL tables.'
            : 'Running in zero-config offline mode. All your workouts, routines, and custom exercises are saved locally in your browser via IndexedDB.'}
        </p>

        {isSupabaseConfigured && (
          <div className="p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
            {signedInEmail ? (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                    Signed in as
                  </span>
                  <span className="text-xs font-bold text-emerald-400 truncate block">
                    {signedInEmail}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 active-press"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isAuthBusy}
                    onClick={() => handleSignIn('signin')}
                    className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 active-press"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    disabled={isAuthBusy}
                    onClick={() => handleSignIn('signup')}
                    className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs active-press"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-zinc-400 block">Offline Sync Queue</span>
            <span className="font-mono text-zinc-200 font-bold">
              {pendingSyncCount} operations waiting
            </span>
          </div>
          {isSupabaseConfigured && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={isSyncBusy}
                onClick={handlePullCloud}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 active-press"
                title="Pull cloud records"
              >
                <CloudDownload className="w-3.5 h-3.5" />
                <span>Pull</span>
              </button>
              <button
                type="button"
                disabled={isSyncBusy}
                onClick={handleManualSync}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 active-press"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncBusy ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            </div>
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

      {/* 4. Backup, Demo Data & Reset */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-lg space-y-4">
        <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-400" />
          <span>Backups & Demo Data</span>
        </h2>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Export your IndexedDB workouts, routines, and bodyweight history as JSON, or reload the
          100+ exercise library and 3-month demo dataset.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-bold flex items-center justify-center gap-2 active-press"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-bold flex items-center justify-center gap-2 active-press"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Import JSON</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportBackup}
            className="hidden"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={handleReloadDemoData}
            disabled={isSeeding}
            className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center justify-center gap-2 active-press"
          >
            <RotateCcw className={`w-4 h-4 text-amber-400 ${isSeeding ? 'animate-spin' : ''}`} />
            <span>{isSeeding ? 'Loading...' : 'Reload 3 Months Demo Data'}</span>
          </button>

          <button
            type="button"
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
            <strong className="text-zinc-200">iOS (Safari):</strong> Tap the <strong>Share</strong>{' '}
            button (box with arrow pointing up) and select <strong>&quot;Add to Home Screen&quot;</strong>.
          </p>
          <p>
            <strong className="text-zinc-200">Android (Chrome):</strong> Tap the{' '}
            <strong>three dots</strong> menu in the upper right and choose{' '}
            <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
