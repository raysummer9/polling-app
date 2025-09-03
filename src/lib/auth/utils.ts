import { headers } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/factory';
import { AppUser, AuthenticatedUser, AnonymousUser } from '@/lib/types/auth';
import { createAuthenticationError, createNotFoundError } from '@/lib/types/error';

/**
 * Gets the current authenticated user from the server context
 * @returns The current user or null if not authenticated
 */
export async function getCurrentUser(): Promise<AppUser> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return createAnonymousUser();
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous',
          avatar_url: user.user_metadata?.avatar_url || null,
        })
        .select()
        .single();

      if (createError || !newProfile) {
        console.error('Failed to create user profile:', createError);
        return createAnonymousUser();
      }

      return createAuthenticatedUser(newProfile, user.email || '');
    }

    return createAuthenticatedUser(profile, user.email || '');
  } catch (error) {
    console.error('Error getting current user:', error);
    return createAnonymousUser();
  }
}

/**
 * Gets the current user's profile by ID
 * @param userId - The user ID to get profile for
 * @returns The user profile or null if not found
 */
export async function getUserProfile(userId: string): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return null;
    }

    // Note: We don't have email here, so we'll use a placeholder
    // In a real app, you might want to get this from the auth.users table
    return createAuthenticatedUser(profile, 'user@example.com');
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

/**
 * Creates an anonymous user object
 */
export function createAnonymousUser(): AnonymousUser {
  return {
    id: null,
    name: 'Anonymous',
    avatar_url: null,
    bio: null,
    created_at: null,
    updated_at: null,
    email: null,
    isAuthenticated: false,
  };
}

/**
 * Creates an authenticated user object
 */
export function createAuthenticatedUser(profile: any, email: string): AuthenticatedUser {
  return {
    ...profile,
    email,
    isAuthenticated: true,
  };
}

/**
 * Gets the client IP address from headers
 * @returns The client IP address or 'unknown'
 */
export async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers();
    const forwarded = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const clientIp = forwarded ? forwarded.split(',')[0] : realIp || 'unknown';
    
    return clientIp;
  } catch (error) {
    console.error('Error getting client IP:', error);
    return 'unknown';
  }
}

/**
 * Gets the user agent from headers
 * @returns The user agent or 'unknown'
 */
export async function getUserAgent(): Promise<string> {
  try {
    const headersList = await headers();
    return headersList.get('user-agent') || 'unknown';
  } catch (error) {
    console.error('Error getting user agent:', error);
    return 'unknown';
  }
}

/**
 * Checks if a user is authenticated
 * @param user - The user to check
 * @returns True if the user is authenticated
 */
export function isAuthenticated(user: AppUser): user is AuthenticatedUser {
  return user.isAuthenticated === true;
}

/**
 * Checks if a user is anonymous
 * @param user - The user to check
 * @returns True if the user is anonymous
 */
export function isAnonymous(user: AppUser): user is AnonymousUser {
  return user.isAuthenticated === false;
}

/**
 * Ensures a user is authenticated, throws error if not
 * @param user - The user to check
 * @param required - Whether authentication is required
 * @throws AuthenticationError if authentication is required but user is not authenticated
 */
export function requireAuthentication(user: AppUser, required: boolean = true): void {
  if (required && !isAuthenticated(user)) {
    throw createAuthenticationError('Authentication required for this operation');
  }
}

/**
 * Ensures a user has permission to access a resource
 * @param user - The user to check
 * @param resourceOwnerId - The ID of the resource owner
 * @param action - The action being performed
 * @throws AuthorizationError if user doesn't have permission
 */
export function requireResourceOwnership(
  user: AppUser,
  resourceOwnerId: string,
  action: string
): void {
  if (!isAuthenticated(user)) {
    throw createAuthenticationError('Authentication required for this operation');
  }

  if (user.id !== resourceOwnerId) {
    throw createNotFoundError('Resource not found or access denied');
  }
}

/**
 * Gets user permissions based on their authentication status
 * @param user - The user to get permissions for
 * @returns Object containing user permissions
 */
export function getUserPermissions(user: AppUser) {
  if (isAnonymous(user)) {
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
