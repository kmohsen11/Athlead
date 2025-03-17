import { useState, useEffect, useCallback } from 'react';
import { Platform, Linking as RNLinking, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { User, AuthSession } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

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
    try {
      // First check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      
      // Only create profile if it doesn't exist
      if (!existingProfile) {
        // Use upsert to handle potential RLS issues
        const { error: insertError } = await supabase
          .from('profiles')
          .upsert([
            {
              id: user.id,
              full_name: user.user_metadata.full_name || user.email?.split('@')[0],
              avatar_url: user.user_metadata.avatar_url,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
          ], { onConflict: 'id' });
        
        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          console.log('Profile created successfully');
        }
      } else {
        console.log('Profile already exists, skipping creation');
      }
    } catch (error) {
      console.error('Error in profile creation:', error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Starting Google sign-in...');
      
      // Create a redirect URL using the app scheme
      const redirectUrl = 'com.athlead.app://auth/callback';
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
      
      // Use Linking instead of WebBrowser
      try {
        await Linking.openURL(data.url);
        
        // Since we can't directly get the result from openURL, we'll need to rely on
        // the auth state change listener to detect when the user is signed in
        return { data: null, error: null };
      } catch (openError) {
        console.error('Error opening URL:', openError);
        Alert.alert('Authentication Error', 'Could not open authentication page');
        return { data: null, error: openError as Error };
      }
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
    try {
      console.log('Starting sign up process for:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          // Make email confirmation optional for development
          emailRedirectTo: 'com.athlead.app://auth/callback',
        },
      });

      console.log('Sign up response:', data, error);

      if (error) {
        console.error('Sign up error:', error);
        return { data, error };
      }

      if (data.user) {
        console.log('Creating profile for user:', data.user.id);
        
        // Create a profile record - using upsert to avoid RLS issues
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert([
            {
              id: data.user.id,
              full_name: fullName,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ], { onConflict: 'id' });
        
        if (profileError) {
          console.error('Error creating profile:', profileError);
          
          // If there's an RLS error, we'll try a different approach
          if (profileError.code === '42501') {
            console.log('Attempting to create profile with alternative method...');
            
            // Wait for the user to be fully created and authenticated
            if (data.session) {
              // Set the auth header with the session token
              const { error: secondAttemptError } = await supabase
                .from('profiles')
                .upsert([
                  {
                    id: data.user.id,
                    full_name: fullName,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                ], { onConflict: 'id' });
              
              if (secondAttemptError) {
                console.error('Second attempt error:', secondAttemptError);
              } else {
                console.log('Profile created successfully on second attempt');
              }
            }
          }
        } else {
          console.log('Profile created successfully');
        }
        
        // For development, you might want to auto-confirm the user
        // This is useful when testing without email verification
        if (data.user.identities && data.user.identities.length > 0) {
          console.log('User created with identity:', data.user.identities[0]);
        }
      }

      return { data, error };
    } catch (err) {
      console.error('Unexpected error during sign up:', err);
      return { data: null, error: err as Error };
    }
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

  // Debug function to get auth status and details
  const getDebugInfo = async () => {
    try {
      // Get current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      // Check profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData?.user?.id || '')
        .single();
      
      return {
        session: sessionData?.session,
        sessionError,
        user: userData?.user,
        userError,
        profile: profileData,
        profileError,
        authStatus: {
          isAuthenticated: !!sessionData?.session,
          userId: userData?.user?.id,
          email: userData?.user?.email,
          userMetadata: userData?.user?.user_metadata,
        }
      };
    } catch (error) {
      console.error('Error getting debug info:', error);
      return { error };
    }
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    resetPassword,
    getDebugInfo,
    authChangeEvent,
  };
} 