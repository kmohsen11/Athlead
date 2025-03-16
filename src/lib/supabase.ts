import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

// Create a custom storage implementation
const ExpoSecureStorage = {
  getItem: (key: string) => {
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    AsyncStorage.removeItem(key);
  },
};

// Replace these with your Supabase project URL and anon key
const supabaseUrl = 'https://ueenuhespsnibaoqezmz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZW51aGVzcHNuaWJhb3Flem16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxMTAyNTYsImV4cCI6MjA1NzY4NjI1Nn0.iEGqNNKPLoIOU9SqdoHwXP-mB6vs1q-kQSIb1sKwdBs';

// Configure deep linking
const deepLinkingConfig = {
  prefixes: ['com.athlead.app://'],
  config: {
    screens: {
      Main: 'main'
    }
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: __DEV__
  }
});

// Export the deep linking configuration
export { deepLinkingConfig };

// Database types
export type User = {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
};

export type WorkoutSession = {
  id: string;
  user_id: string;
  workout_type: string;
  start_time: string;
  end_time: string;
  notes?: string;
  created_at: string;
};

export type EMGData = {
  id: string;
  workout_session_id: string;
  timestamp: string;
  sensor_data: number[];
  muscle_group: string;
  intensity: number;
  created_at: string;
};

export type HealthMetric = {
  id: string;
  user_id: string;
  metric_type: string; // heart_rate, steps, etc.
  value: number;
  timestamp: string;
  source: string; // apple_health, emg_sensor, etc.
  created_at: string;
};

export type UserGoal = {
  id: string;
  user_id: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  status: 'in_progress' | 'completed' | 'failed';
  created_at: string;
}; 