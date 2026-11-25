-- Supabase PostgreSQL Schema for Gym Workout Tracker
-- Idempotent setup script with strict Row Level Security (RLS)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Exercises Table
CREATE TABLE IF NOT EXISTS public.exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  secondary_muscles JSONB DEFAULT '[]'::jsonb,
  equipment TEXT NOT NULL,
  instructions TEXT,
  is_custom BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Routines Table
CREATE TABLE IF NOT EXISTS public.routines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  exercises JSONB DEFAULT '[]'::jsonb NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Workouts Table
CREATE TABLE IF NOT EXISTS public.workouts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  routine_id TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  notes TEXT,
  exercises JSONB DEFAULT '[]'::jsonb NOT NULL,
  total_volume NUMERIC DEFAULT 0,
  total_sets INTEGER DEFAULT 0,
  total_reps INTEGER DEFAULT 0,
  pr_count INTEGER DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Bodyweight Logs Table
CREATE TABLE IF NOT EXISTS public.bodyweight_logs (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  weight NUMERIC NOT NULL,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_exercises_muscle ON public.exercises(muscle_group);
CREATE INDEX IF NOT EXISTS idx_exercises_user ON public.exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_routines_user ON public.routines(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_user_start ON public.workouts(user_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_bodyweight_user_date ON public.bodyweight_logs(user_id, date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bodyweight_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Exercises (public catalog readable by everyone; custom exercises strictly user-owned)
DROP POLICY IF EXISTS "Public exercises are viewable by everyone" ON public.exercises;
CREATE POLICY "Public exercises are viewable by everyone" ON public.exercises
  FOR SELECT USING (is_custom = false OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own custom exercises" ON public.exercises;
CREATE POLICY "Users can insert their own custom exercises" ON public.exercises
  FOR INSERT WITH CHECK (is_custom = true AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own custom exercises" ON public.exercises;
CREATE POLICY "Users can update their own custom exercises" ON public.exercises
  FOR UPDATE USING (is_custom = true AND auth.uid() = user_id)
  WITH CHECK (is_custom = true AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own custom exercises" ON public.exercises;
CREATE POLICY "Users can delete their own custom exercises" ON public.exercises
  FOR DELETE USING (is_custom = true AND auth.uid() = user_id);

-- RLS Policies: Routines
DROP POLICY IF EXISTS "Users can view their own routines" ON public.routines;
CREATE POLICY "Users can view their own routines" ON public.routines
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own routines" ON public.routines;
CREATE POLICY "Users can insert their own routines" ON public.routines
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own routines" ON public.routines;
CREATE POLICY "Users can update their own routines" ON public.routines
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own routines" ON public.routines;
CREATE POLICY "Users can delete their own routines" ON public.routines
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: Workouts
DROP POLICY IF EXISTS "Users can view their own workouts" ON public.workouts;
CREATE POLICY "Users can view their own workouts" ON public.workouts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own workouts" ON public.workouts;
CREATE POLICY "Users can insert their own workouts" ON public.workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own workouts" ON public.workouts;
CREATE POLICY "Users can update their own workouts" ON public.workouts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own workouts" ON public.workouts;
CREATE POLICY "Users can delete their own workouts" ON public.workouts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies: Bodyweight Logs
DROP POLICY IF EXISTS "Users can view their own bodyweight" ON public.bodyweight_logs;
CREATE POLICY "Users can view their own bodyweight" ON public.bodyweight_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own bodyweight" ON public.bodyweight_logs;
CREATE POLICY "Users can insert their own bodyweight" ON public.bodyweight_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own bodyweight" ON public.bodyweight_logs;
CREATE POLICY "Users can update their own bodyweight" ON public.bodyweight_logs
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bodyweight" ON public.bodyweight_logs;
CREATE POLICY "Users can delete their own bodyweight" ON public.bodyweight_logs
  FOR DELETE USING (auth.uid() = user_id);
