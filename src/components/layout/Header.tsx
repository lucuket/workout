'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dumbbell, Cloud, CloudOff, RefreshCw, Settings, Play } from 'lucide-react';
import { subscribeSyncState, SyncStatus, checkAndProcessSync } from '@/lib/sync';
import { getActiveWorkout } from '@/lib/db';
import { Workout } from '@/lib/types';

export default function Header() {
  const pathname = usePathname();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local_only');
  const [pendingCount, setPendingCount] = useState(0);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    const unsub = subscribeSyncState((status, count) => {
      setSyncStatus(status);
      setPendingCount(count);
    });

    const checkActive = async () => {
      try {
        const active = await getActiveWorkout();
        setActiveWorkout(active);
      } catch {
        // Ignore in SSR
      }
    };

    checkActive();
    const interval = setInterval(checkActive, 3000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [pathname]);

  const handleSyncClick = () => {
    checkAndProcessSync();
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 py-3 pt-safe">
      <div className="max-w-xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 active-press">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div>
            <div className="font-black text-sm tracking-wider uppercase text-zinc-100 flex items-center gap-1.5">
              <span>APEX</span>
              <span className="text-emerald-400">LIFT</span>
            </div>
            <div className="text-[10px] text-zinc-500 font-mono tracking-tight -mt-0.5">TRACKER</div>
          </div>
        </Link>

        {/* Right Action Icons: Active workout indicator + Sync Status + Settings */}
        <div className="flex items-center gap-2">
          {/* Active Workout Banner / Chip if in progress and not currently on /workout */}
          {activeWorkout && pathname !== '/workout' && (
            <Link
              href="/workout"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium rounded-full animate-pulse-subtle active-press"
            >
              <Play className="w-3 h-3 fill-emerald-400 text-emerald-400" />
              <span>Resume</span>
            </Link>
          )}

          {/* Sync Status Pill */}
          <button
            onClick={handleSyncClick}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-mono border transition-colors active-press bg-zinc-900 border-zinc-800"
            title="Tap to sync with cloud"
          >
            {syncStatus === 'synced' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-zinc-400">Synced</span>
              </>
            )}
            {syncStatus === 'syncing' && (
              <>
                <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
                <span className="text-cyan-400">Syncing</span>
              </>
            )}
            {syncStatus === 'offline' && (
              <>
                <CloudOff className="w-3 h-3 text-amber-400" />
                <span className="text-amber-400">{pendingCount > 0 ? `${pendingCount} offline` : 'Offline'}</span>
              </>
            )}
            {syncStatus === 'pending' && (
              <>
                <RefreshCw className="w-3 h-3 text-amber-400" />
                <span className="text-amber-400">{pendingCount} pending</span>
              </>
            )}
            {syncStatus === 'local_only' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                <span className="text-zinc-400">Local DB</span>
              </>
            )}
          </button>

          {/* Settings */}
          <Link
            href="/settings"
            className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 active-press"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
