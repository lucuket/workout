// Web Audio API synthesized alert chime and notification dispatcher
import { withBasePath } from './constants';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const win = window as Window & { webkitAudioContext?: typeof AudioContext };
    const AudioContextClass = window.AudioContext || win.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      // Ignore autoplay resume errors until user gesture
    });
  }
  return audioCtx;
}

export function playTimerChime(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Chime tone 1: 587.33 Hz (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Chime tone 2: 880 Hz (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.2);
    gain2.gain.setValueAtTime(0.4, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.8);
  } catch (err) {
    console.error('Audio playback failed:', err);
  }
}

export function triggerHaptic(pattern: number | number[] = 15): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors
    }
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    try {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch {
      return false;
    }
  }
  return false;
}

export function sendRestCompleteNotification(exerciseName?: string): void {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('Rest Time Up! ⏱️', {
        body: exerciseName ? `Ready for your next set of ${exerciseName}` : 'Time to crush the next set!',
        icon: withBasePath('/icons/icon-192.svg'),
        tag: 'rest-timer',
      });
    } catch {
      // Fallback for mobile browsers that require ServiceWorkerRegistration.showNotification
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((reg) =>
            reg.showNotification('Rest Time Up! ⏱️', {
              body: exerciseName ? `Ready for your next set of ${exerciseName}` : 'Time to crush the next set!',
              icon: withBasePath('/icons/icon-192.svg'),
              tag: 'rest-timer',
            })
          )
          .catch(() => {
            // Ignore notification errors
          });
      }
    }
  }
}
