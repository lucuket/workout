import { Equipment, MuscleGroup, RoutineCategory, UserPreferences } from './types';

export const DEFAULT_PREFERENCES: UserPreferences = {
  weight_unit: 'lbs',
  barbell_weight: 45,
  default_rest_seconds: 90,
  sound_enabled: true,
  haptic_enabled: true,
  theme: 'dark',
  weekly_goal_workouts: 4,
};

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Biceps',
  'Triceps',
  'Forearms',
  'Core',
  'Cardio',
  'Full Body',
];

export const EQUIPMENT_OPTIONS: Equipment[] = [
  'Barbell',
  'Dumbbell',
  'Cable',
  'Machine',
  'Bodyweight',
  'Kettlebell',
  'Smith Machine',
  'Bands',
  'Cardio Machine',
  'Other',
];

export const ROUTINE_CATEGORIES: RoutineCategory[] = [
  'Push',
  'Pull',
  'Legs',
  'Upper',
  'Lower',
  'Full Body',
  'Custom',
];

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function withBasePath(assetPath: string): string {
  const normalized = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return `${BASE_PATH}${normalized}`;
}

export function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Formats a Date, timestamp, or ISO string as a local YYYY-MM-DD key
 * so late-evening workouts stay on the user's local calendar day.
 */
export function toLocalDateKey(input: Date | string | number): string {
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return input;
  }
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) {
    return toLocalDateKey(new Date());
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a YYYY-MM-DD key into a local Date at midday to avoid DST/UTC shift bugs.
 */
export function parseLocalDateKey(dateKey: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    return new Date(dateKey);
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0, 0);
}

/**
 * Formats a date or YYYY-MM-DD key as M/D in local time for compact chart labels.
 */
export function formatShortLocalDate(input: Date | string | number): string {
  const dateKey = toLocalDateKey(input);
  const d = parseLocalDateKey(dateKey);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
