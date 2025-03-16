-- Create tables with RLS (Row Level Security) enabled

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT username_length CHECK (char_length(full_name) >= 3)
);

-- Workout sessions table
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  workout_type TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- EMG data table
CREATE TABLE IF NOT EXISTS public.emg_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workout_session_id UUID REFERENCES public.workout_sessions(id) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  sensor_data NUMERIC[] NOT NULL,
  muscle_group TEXT NOT NULL,
  intensity NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Health metrics table
CREATE TABLE IF NOT EXISTS public.health_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User goals table
CREATE TABLE IF NOT EXISTS public.user_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  goal_type TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT status_values CHECK (status IN ('in_progress', 'completed', 'failed'))
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emg_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Profiles: Users can only read their own profile
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

-- Profiles: Users can update own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Workout Sessions: Users can CRUD their own sessions
CREATE POLICY "Users can CRUD own workout sessions"
  ON public.workout_sessions FOR ALL
  USING (auth.uid() = user_id);

-- EMG Data: Users can CRUD their own EMG data through workout sessions
CREATE POLICY "Users can CRUD own EMG data"
  ON public.emg_data FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_sessions ws 
      WHERE ws.id = emg_data.workout_session_id 
      AND ws.user_id = auth.uid()
    )
  );

-- Health Metrics: Users can CRUD their own metrics
CREATE POLICY "Users can CRUD own health metrics"
  ON public.health_metrics FOR ALL
  USING (auth.uid() = user_id);

-- User Goals: Users can CRUD their own goals
CREATE POLICY "Users can CRUD own goals"
  ON public.user_goals FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS workout_sessions_user_id_idx ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS emg_data_workout_session_id_idx ON public.emg_data(workout_session_id);
CREATE INDEX IF NOT EXISTS health_metrics_user_id_idx ON public.health_metrics(user_id);
CREATE INDEX IF NOT EXISTS user_goals_user_id_idx ON public.user_goals(user_id); 