import { Database } from './database';

// Base types from database
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type User = Database['public']['Tables']['profiles']['Row'];

// Extended user types
export interface AuthenticatedUser extends Profile {
  email: string;
  isAuthenticated: true;
}

export interface AnonymousUser {
  id: null;
  name: 'Anonymous';
  avatar_url: null;
  bio: null;
  created_at: null;
  updated_at: null;
  email: null;
  isAuthenticated: false;
}

export type AppUser = AuthenticatedUser | AnonymousUser;

// Authentication context
export interface AuthContext {
  user: AppUser;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, name: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Authentication results
export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

// Authentication state
export interface AuthState {
  user: AppUser | null;
  isLoading: boolean;
  isInitialized: boolean;
}

// User permissions and roles
export interface UserPermissions {
  canCreatePolls: boolean;
  canEditOwnPolls: boolean;
  canDeleteOwnPolls: boolean;
  canVote: boolean;
  canViewResults: boolean;
}

// Session information
export interface SessionInfo {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  lastActivity: string;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Registration data
export interface RegistrationData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

// Password reset
export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// Profile update
export interface ProfileUpdateData {
  name?: string;
  avatar_url?: string;
  bio?: string;
}

// Type guards
export function isAuthenticatedUser(user: AppUser): user is AuthenticatedUser {
  return user.isAuthenticated === true;
}

export function isAnonymousUser(user: AppUser): user is AnonymousUser {
  return user.isAuthenticated === false;
}

export function hasPermission(
  user: AppUser,
  permission: keyof UserPermissions
): boolean {
  if (isAnonymousUser(user)) {
    return permission === 'canVote' || permission === 'canViewResults';
  }
  
  // For authenticated users, implement permission logic here
  // This could be based on user roles, subscription status, etc.
  return true;
}

// Default permissions for different user types
export function getDefaultPermissions(user: AppUser): UserPermissions {
  if (isAnonymousUser(user)) {
    return {
      canCreatePolls: false,
      canEditOwnPolls: false,
      canDeleteOwnPolls: false,
      canVote: true,
      canViewResults: true,
    };
  }

  return {
    canCreatePolls: true,
    canEditOwnPolls: true,
    canDeleteOwnPolls: true,
    canVote: true,
    canViewResults: true,
  };
}
