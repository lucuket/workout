export type MuscleGroup =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Biceps'
  | 'Triceps'
  | 'Forearms'
  | 'Core'
  | 'Cardio'
  | 'Full Body';

export type Equipment =
  | 'Barbell'
  | 'Dumbbell'
  | 'Cable'
  | 'Machine'
  | 'Bodyweight'
  | 'Kettlebell'
  | 'Smith Machine'
  | 'Bands'
  | 'Cardio Machine'
  | 'Other';

export interface Exercise {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  secondary_muscles?: MuscleGroup[];
  equipment: Equipment;
  instructions?: string;
  is_custom?: boolean;
  created_at?: string;
}

export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure';

export interface WorkoutSet {
  id: string;
  set_number: number;
  type: SetType;
  weight: number; // in user preferred unit
  reps: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  completed: boolean;
  completed_at?: string;
  previous_weight?: number;
  previous_reps?: number;
}

export interface WorkoutExercise {
  id: string;
  exercise_id: string;
  exercise_name: string;
  muscle_group: MuscleGroup;
  equipment: Equipment;
  order: number;
  notes?: string;
  rest_seconds: number;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  name: string;
  routine_id?: string;
  start_time: string;
  end_time?: string;
  duration_seconds: number;
  notes?: string;
  exercises: WorkoutExercise[];
  total_volume: number; // sum of (weight * reps) for completed sets
  total_sets: number;
  total_reps: number;
  pr_count: number;
  created_at: string;
  updated_at: string;
  synced?: boolean;
}

export interface RoutineExerciseTemplate {
  exercise_id: string;
  exercise_name: string;
  muscle_group: MuscleGroup;
  equipment: Equipment;
  order: number;
  target_sets: number;
  target_reps: string; // e.g. "8-12" or "5"
  target_rest_seconds: number;
  notes?: string;
}

export interface RoutineTemplate {
  id: string;
  name: string;
  description?: string;
  category?: 'Push' | 'Pull' | 'Legs' | 'Upper' | 'Lower' | 'Full Body' | 'Custom';
  exercises: RoutineExerciseTemplate[];
  created_at: string;
  updated_at: string;
}

export interface BodyweightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number;
  notes?: string;
  created_at: string;
}

export interface PersonalRecord {
  exercise_id: string;
  exercise_name: string;
  max_weight: { weight: number; reps: number; date: string; workout_id: string };
  max_1rm: { value: number; weight: number; reps: number; date: string; workout_id: string };
  max_volume: { volume: number; weight: number; reps: number; date: string; workout_id: string };
}

export type SyncAction =
  | 'UPSERT_WORKOUT'
  | 'DELETE_WORKOUT'
  | 'UPSERT_ROUTINE'
  | 'DELETE_ROUTINE'
  | 'UPSERT_EXERCISE'
  | 'UPSERT_BODYWEIGHT'
  | 'DELETE_BODYWEIGHT';

export interface SyncQueueItem {
  id: string;
  action: SyncAction;
  entity_id: string;
  payload: any;
  timestamp: string;
  retries: number;
}

export interface UserPreferences {
  weight_unit: 'lbs' | 'kg';
  barbell_weight: number; // 45 lbs or 20 kg
  default_rest_seconds: number;
  sound_enabled: boolean;
  haptic_enabled: boolean;
  theme: 'dark';
  weekly_goal_workouts: number;
}
