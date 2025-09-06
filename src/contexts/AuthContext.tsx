"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { ensureProfileExists } from '@/lib/api/profiles';

/**
 * Authentication context interface defining the shape of auth state and methods
 * 
 * @interface AuthContextType
 * @property {User | null} user - Current authenticated user or null if not logged in
 * @property {boolean} loading - Loading state for authentication operations
 * @property {Function} signIn - Function to sign in with email and password
 * @property {Function} signUp - Function to create new user account
 * @property {Function} signOut - Function to sign out current user
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

/**
 * React context for managing authentication state across the application
 * Provides centralized access to user authentication status and auth methods
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 * 
 * Manages the global authentication state for the entire application.
 * This component:
 * - Initializes the Supabase client for authentication
 * - Handles session persistence and restoration on app load
 * - Listens for authentication state changes (login/logout)
 * - Automatically creates user profiles when users sign up
 * - Provides authentication methods to child components
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components that need access to auth context
 * @returns {JSX.Element} AuthProvider component wrapping the app
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Current authenticated user state - null if not logged in
  const [user, setUser] = useState<User | null>(null);
  // Loading state to prevent flash of unauthenticated content
  const [loading, setLoading] = useState(true);
  // Supabase client instance for authentication operations
  const supabase = createClient();

  useEffect(() => {
    /**
     * Initialize authentication state on component mount
     * This function:
     * - Retrieves any existing session from Supabase
     * - Sets the user state if a valid session exists
     * - Ensures user profile exists in our database
     * - Sets loading to false to show the app
     */
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // Ensure profile exists for the user - this creates a profile record
        // in our profiles table if it doesn't exist, maintaining data consistency
        await ensureProfileExists(session.user.id, session.user);
      }
      setLoading(false);
    };

    getInitialSession();

    /**
     * Set up authentication state change listener
     * This listener handles:
     * - User sign in/out events
     * - Token refresh events
     * - Session expiration
     * - Profile creation for new users
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          // Ensure profile exists for new users or when tokens are refreshed
          // This handles cases where the user exists in Supabase Auth but not in our profiles table
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await ensureProfileExists(session.user.id, session.user);
          }
        } else {
          // Clear user state when signed out or session expires
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Cleanup subscription on component unmount to prevent memory leaks
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  /**
   * Sign in an existing user with email and password
   * 
   * This function:
   * - Validates credentials against Supabase Auth
   * - Creates a new session if credentials are valid
   * - Triggers the auth state change listener to update user state
   * - Returns any authentication errors for handling by the UI
   * 
   * @param {string} email - User's email address
   * @param {string} password - User's password
   * @returns {Promise<{error: any}>} Object containing any authentication error
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  /**
   * Create a new user account with email, password, and name
   * 
   * This function:
   * - Creates a new user in Supabase Auth
   * - Sends a verification email to the user (if email confirmation is enabled)
   * - Stores the user's name in the user metadata
   * - The user profile will be created automatically via the auth state change listener
   * 
   * @param {string} email - User's email address
   * @param {string} password - User's password (must meet Supabase password requirements)
   * @param {string} name - User's display name
   * @returns {Promise<{error: any}>} Object containing any registration error
   */
  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    return { error };
  };

  /**
   * Sign out the current user and clear their session
   * 
   * This function:
   * - Invalidates the current session
   * - Clears authentication cookies
   * - Triggers the auth state change listener to clear user state
   * - Redirects user to unauthenticated state
   */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Context value object containing all authentication state and methods
  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access authentication context
 * 
 * This hook provides access to the authentication state and methods.
 * It must be used within an AuthProvider component, otherwise it will throw an error.
 * 
 * @returns {AuthContextType} Authentication context containing user state and auth methods
 * @throws {Error} If used outside of an AuthProvider component
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, loading, signIn, signOut } = useAuth();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (!user) return <LoginForm />;
 *   
 *   return <div>Welcome, {user.email}!</div>;
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
