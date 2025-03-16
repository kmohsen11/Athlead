import { useState, useEffect, useCallback } from 'react';
import { Platform, Linking as RNLinking, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { User, AuthSession } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

// Initialize WebBrowser for Google Auth
WebBrowser.maybeCompleteAuthSession();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChangeEvent, setAuthChangeEvent] = useState<string | null>(null);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: AuthSession | null } }) => {
      console.log('Initial session check:', session ? 'User logged in' : 'No user');
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (signed in, signed out, etc.)
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event: string, session: AuthSession | null) => {
      console.log('Auth state changed:', event, session ? 'User present' : 'No user');
      setUser(session?.user ?? null);
      setAuthChangeEvent(event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await createProfile(session.user);
      }
      
      setLoading(false);
    });

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  const createProfile = async (user: User) => {
    const { error } = await supabase.from('profiles').select().eq('id', user.id);
    
    // Only create profile if it doesn't exist
    if (error) {
      await supabase.from('profiles').insert([
        {
          id: user.id,
          full_name: user.user_metadata.full_name || user.email?.split('@')[0],
          avatar_url: user.user_metadata.avatar_url,
          created_at: new Date().toISOString(),
        },
      ]);
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google sign-in...');
      
      // Create a redirect URL using the app scheme
      const redirectUrl = 'com.athlead.app://home';
      console.log('Using redirect URL:', redirectUrl);
      
      // Start the OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          // Important: Set this to true for mobile apps
          skipBrowserRedirect: true
        },
      });

      if (error) {
        console.error('Google sign-in error:', error.message);
        Alert.alert('Authentication Error', error.message);
        return { data: null, error };
      }

      if (!data?.url) {
        console.error('No URL returned from signInWithOAuth');
        Alert.alert('Authentication Error', 'Failed to get authentication URL');
        return { data: null, error: new Error('No URL returned') };
      }

      console.log('Opening auth URL:', data.url);
      
      // Open the authentication URL in a browser
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl
      );
      
      console.log('Browser session result:', result);

      // Check if the session was successful
      if (result.type === 'success') {
        // Get the current session to verify authentication worked
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('Session after auth:', sessionData?.session ? 'Session exists' : 'No session');
        
        if (sessionData?.session) {
          console.log('Successfully authenticated with session');
          return { data: sessionData, error: null };
        } else {
          // If we don't have a session yet, try to extract the code from the URL
          console.log('No session found, checking URL for auth code');
          if (result.url) {
            const url = new URL(result.url);
            const code = url.searchParams.get('code');
            
            if (code) {
              console.log('Found auth code, exchanging for session');
              // Exchange the code for a session
              const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
              
              if (exchangeError) {
                console.error('Code exchange error:', exchangeError.message);
                return { data: null, error: exchangeError };
              }
              
              return { data: exchangeData, error: null };
            }
          }
        }
      }
      
      // If we reach here, the authentication was either canceled or failed
      if (result.type === 'cancel') {
        console.log('User canceled the sign-in');
      } else {
        console.error('Authentication failed:', result.type);
      }
      
      return { data: null, error: null };
    } catch (error: any) {
      console.error('Unexpected error during Google sign-in:', error);
      Alert.alert('Authentication Error', 'An unexpected error occurred during sign-in.');
      return { data: null, error };
    }
  };

  const signOut = async () => {
    const result = await supabase.auth.signOut();
    setAuthChangeEvent('SIGNED_OUT');
    return result;
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (data.user) {
      // Create a profile record
      await supabase.from('profiles').insert([
        {
          id: data.user.id,
          full_name: fullName,
          created_at: new Date().toISOString(),
        },
      ]);
    }

    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  };

  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email);
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    signInWithGoogle,
    authChangeEvent
  };
} 