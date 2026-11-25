'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, FolderKanban, TrendingUp, CalendarDays, BookOpen } from 'lucide-react';
import { getActiveWorkout, subscribeActiveWorkout } from '@/lib/db';

export default function BottomNav() {
  const pathname = usePathname();
  const [hasActiveSession, setHasActiveSession] = useState(false);

  useEffect(() => {
    const unsub = subscribeActiveWorkout((active) => {
      setHasActiveSession(Boolean(active));
    });

    getActiveWorkout()
      .then((active) => setHasActiveSession(Boolean(active)))
      .catch(() => {
        // Ignore in SSR
      });

    return unsub;
  }, []);

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Routines', href: '/routines', icon: FolderKanban },
    {
      label: 'Workout',
      href: '/workout',
      icon: Dumbbell,
      isAction: true,
      highlight: hasActiveSession,
    },
    { label: 'Library', href: '/exercises', icon: BookOpen },
    { label: 'Progress', href: '/progress', icon: TrendingUp },
    { label: 'History', href: '/history', icon: CalendarDays },
  ];

  const isRouteActive = (href: string) => {
    const normalized = pathname?.replace(/\/$/, '') || '/';
    if (href === '/') return normalized === '/';
    return normalized === href || normalized.startsWith(`${href}/`);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800/80 pb-safe">
      <div className="max-w-xl mx-auto flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = isRouteActive(item.href);
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-3 flex flex-col items-center group active-press"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${
                    item.highlight
                      ? 'bg-emerald-500 text-zinc-950 shadow-emerald-500/30 ring-4 ring-emerald-500/20 animate-pulse'
                      : isActive
                      ? 'bg-emerald-500 text-zinc-950 shadow-emerald-500/25'
                      : 'bg-zinc-800 border border-zinc-700 text-emerald-400 group-hover:bg-zinc-700'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span
                  className={`text-[10px] font-medium tracking-tight mt-0.5 ${
                    isActive ? 'text-emerald-400 font-semibold' : 'text-zinc-400'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors active-press ${
                isActive ? 'text-emerald-400' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className={`text-[10px] tracking-tight mt-1 ${isActive ? 'font-semibold' : 'font-normal'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
