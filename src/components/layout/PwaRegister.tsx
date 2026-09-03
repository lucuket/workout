'use client';

import { useEffect } from 'react';
import { initDatabase } from '@/lib/db';
import { checkAndProcessSync } from '@/lib/sync';

export default function PwaRegister() {
  useEffect(() => {
    // 1. Initialize IndexedDB & Seed
    initDatabase().catch((err) => console.error('DB init failed:', err));

    // 2. Register Service Worker in production/browser
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        const swUrl = `${window.location.pathname.replace(/\/$/, '')}/sw.js`;
        navigator.serviceWorker
          .register(swUrl)
          .then((reg) => {
            console.log('PWA Service Worker registered:', reg.scope);
          })
          .catch((err) => {
            console.error('Service Worker registration failed:', err);
          });
      });
    }

    // 3. Initial sync check
    checkAndProcessSync();
  }, []);

  return null;
}
