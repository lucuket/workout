'use client';

import { useEffect } from 'react';
import { initDatabase } from '@/lib/db';
import { checkAndProcessSync, initSyncListeners } from '@/lib/sync';
import { withBasePath } from '@/lib/constants';

export default function PwaRegister() {
  useEffect(() => {
    // 1. Initialize IndexedDB & Seed
    initDatabase().catch((err) => console.error('DB init failed:', err));

    // 2. Register Service Worker at the app root scope (handles GitHub Pages /workout/ basePath)
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const registerSw = () => {
        const swUrl = withBasePath('/sw.js');
        const scope = withBasePath('/');
        navigator.serviceWorker
          .register(swUrl, { scope })
          .catch((err) => {
            console.error('Service Worker registration failed:', err);
          });
      };

      if (document.readyState === 'complete') {
        registerSw();
      } else {
        window.addEventListener('load', registerSw, { once: true });
      }
    }

    // 3. Initialize online/offline/queue/auth sync listeners and run initial sync check
    initSyncListeners();
    void checkAndProcessSync();
  }, []);

  return null;
}
