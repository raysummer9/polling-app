import { createServerSupabaseClient } from '@/lib/supabase/factory';
import { createAuthenticationError } from '@/lib/types/error';

/**
 * Session management and validation utilities
 */
export class SessionManager {
  private static readonly MAX_SESSION_AGE = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly MAX_IDLE_TIME = 2 * 60 * 60 * 1000; // 2 hours
  private static readonly SESSION_REFRESH_THRESHOLD = 30 * 60 * 1000; // 30 minutes

  /**
   * Validate user session with enhanced security checks
   */
  static async validateSession(): Promise<{
    user: unknown;
    session: unknown;
    needsRefresh: boolean;
  }> {
    try {
      const supabase = await createServerSupabaseClient();
      
      // Get current user and session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (userError || sessionError) {
        throw createAuthenticationError(
          'Session validation failed',
          true,
          'Please log in again'
        );
      }

      if (!user || !session) {
        throw createAuthenticationError(
          'No active session',
          true,
          'Please log in to continue'
        );
      }

      // Check session age
      const sessionAge = Date.now() - new Date(session.expires_at || 0).getTime();
      if (sessionAge > this.MAX_SESSION_AGE) {
        throw createAuthenticationError(
          'Session expired',
          true,
          'Please log in again'
        );
      }

      // Check if session needs refresh
      const timeUntilExpiry = new Date(session.expires_at || 0).getTime() - Date.now();
      const needsRefresh = timeUntilExpiry < this.SESSION_REFRESH_THRESHOLD;

      return { user, session, needsRefresh };
    } catch (error) {
      if ((error as { code?: string })?.code === 'AUTHENTICATION_ERROR') {
        throw error;
      }
      
      console.error('Session validation error:', error);
      throw createAuthenticationError(
        'Session validation failed',
        true,
        'Please log in again'
      );
    }
  }

  /**
   * Refresh session if needed
   */
  static async refreshSessionIfNeeded(): Promise<void> {
    try {
      const { needsRefresh } = await this.validateSession();
      
      if (needsRefresh) {
        const supabase = await createServerSupabaseClient();
        const { error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.error('Session refresh failed:', error);
          throw createAuthenticationError(
            'Session refresh failed',
            true,
            'Please log in again'
          );
        }
      }
    } catch (error) {
      if ((error as { code?: string })?.code === 'AUTHENTICATION_ERROR') {
        throw error;
      }
      
      console.error('Session refresh error:', error);
      throw createAuthenticationError(
        'Session management failed',
        true,
        'Please log in again'
      );
    }
  }

  /**
   * Validate session with activity tracking
   */
  static async validateSessionWithActivity(): Promise<{
    user: unknown;
    session: unknown;
    isActive: boolean;
  }> {
    try {
      const { user, session } = await this.validateSession();
      
      // Check last activity (this would require storing activity timestamps)
      // For now, we'll use session creation time as a proxy
      const lastActivity = new Date((session as { created_at?: string })?.created_at || 0).getTime();
      const timeSinceActivity = Date.now() - lastActivity;
      
      const isActive = timeSinceActivity < this.MAX_IDLE_TIME;
      
      if (!isActive) {
        throw createAuthenticationError(
          'Session inactive',
          true,
          'Please log in again'
        );
      }

      return { user, session, isActive };
    } catch (error) {
      if ((error as { code?: string })?.code === 'AUTHENTICATION_ERROR') {
        throw error;
      }
      
      console.error('Session activity validation error:', error);
      throw createAuthenticationError(
        'Session validation failed',
        true,
        'Please log in again'
      );
    }
  }

  /**
   * Force session logout
   */
  static async forceLogout(): Promise<void> {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Force logout error:', error);
      // Don't throw here as we want to ensure logout happens
    }
  }

  /**
   * Check if session is valid for a specific operation
   */
  static async validateSessionForOperation(
    operation: string,
    requireRecentActivity: boolean = false
  ): Promise<{ user: unknown; session: unknown }> {
    try {
      const validation = requireRecentActivity 
        ? await this.validateSessionWithActivity()
        : await this.validateSession();

      // Log security event for sensitive operations
      if (['delete', 'update', 'create'].includes(operation.toLowerCase())) {
        console.log(`[SECURITY] User ${(validation.user as { id?: string })?.id} performing ${operation} operation`);
      }

      return { user: validation.user, session: validation.session };
    } catch (error) {
      if ((error as { code?: string })?.code === 'AUTHENTICATION_ERROR') {
        throw error;
      }
      
      console.error(`Session validation for ${operation} failed:`, error);
      throw createAuthenticationError(
        'Session validation failed',
        true,
        'Please log in again'
      );
    }
  }
}

/**
 * Enhanced session validation for server actions
 */
export async function validateSession(): Promise<{ user: unknown; session: unknown }> {
  return await SessionManager.validateSessionForOperation('general');
}

/**
 * Enhanced session validation for sensitive operations
 */
export async function validateSessionForSensitiveOperation(): Promise<{ user: unknown; session: unknown }> {
  return await SessionManager.validateSessionForOperation('sensitive', true);
}

/**
 * Session validation wrapper for server actions
 */
export function withSessionValidation<T extends unknown[], R>(
  fn: (user: unknown, session: unknown, ...args: T) => Promise<R>,
  requireRecentActivity: boolean = false
) {
  return async (...args: T): Promise<R> => {
    const { user, session } = requireRecentActivity
      ? await validateSessionForSensitiveOperation()
      : await validateSession();
    
    return fn(user, session, ...args);
  };
}

/**
 * Session validation with automatic refresh
 */
export async function validateSessionWithRefresh(): Promise<{ user: unknown; session: unknown }> {
  await SessionManager.refreshSessionIfNeeded();
  return await validateSession();
}
