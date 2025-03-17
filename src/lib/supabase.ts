import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
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

// Configure deep linking
const resolveURL = () => {
  const scheme = 'com.athlead.app';
  const prefix = Linking.createURL('/');
  return {
    scheme,
    prefix,
  };
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

// Get the URL that was used to start the app
const getInitialURL = async () => {
  const url = await Linking.getInitialURL();
  return url;
};

// Subscribe to URL changes
const subscribeToURLChanges = (callback: (url: string) => void) => {
  const subscription = Linking.addEventListener('url', ({ url }) => {
    callback(url);
  });
  
  return () => {
    subscription.remove();
  };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
    debug: __DEV__, // Enable debug logs in development
  },
});

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth state change:', event, session ? 'Session exists' : 'No session');
});

// Export the deep linking configuration
export { deepLinkingConfig, getInitialURL, subscribeToURLChanges };

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