import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth as useSupabaseAuth } from '../hooks/useAuth';
import { User } from '@supabase/supabase-js';

// Define the context type
type AuthContextType = {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
};

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUp: async () => ({}),
  signIn: async () => ({}),
  signOut: async () => ({}),
  resetPassword: async () => ({}),
  signInWithGoogle: async () => ({}),
});

// Create the provider component
export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    signInWithGoogle,
  } = useSupabaseAuth();

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Create a hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
}; 