import { headers } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/factory';
import { createAuthenticationError } from '@/lib/types/error';

/**
 * CSRF token generation and validation
 */
export class CSRFProtection {
  private static readonly TOKEN_LENGTH = 32;
  private static readonly TOKEN_HEADER = 'x-csrf-token';
  private static readonly TOKEN_COOKIE = 'csrf-token';

  /**
   * Generate a cryptographically secure CSRF token
   */
  static generateToken(): string {
    const array = new Uint8Array(this.TOKEN_LENGTH);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get CSRF token from request headers
   */
  static async getTokenFromRequest(): Promise<string | null> {
    try {
      const headersList = await headers();
      return headersList.get(this.TOKEN_HEADER);
    } catch (error) {
      console.error('Error getting CSRF token from headers:', error);
      return null;
    }
  }

  /**
   * Get CSRF token from cookies
   */
  static async getTokenFromCookies(): Promise<string | null> {
    try {
      const headersList = await headers();
      const cookieHeader = headersList.get('cookie');
      if (!cookieHeader) return null;

      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {} as Record<string, string>);

      return cookies[this.TOKEN_COOKIE] || null;
    } catch (error) {
      console.error('Error getting CSRF token from cookies:', error);
      return null;
    }
  }

  /**
   * Validate CSRF token
   */
  static async validateToken(providedToken: string): Promise<boolean> {
    try {
      const cookieToken = await this.getTokenFromCookies();
      
      if (!cookieToken || !providedToken) {
        return false;
      }

      // Use constant-time comparison to prevent timing attacks
      return this.constantTimeCompare(providedToken, cookieToken);
    } catch (error) {
      console.error('Error validating CSRF token:', error);
      return false;
    }
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Create CSRF token cookie
   */
  static createTokenCookie(token: string): string {
    return `${this.TOKEN_COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`;
  }
}

/**
 * CSRF protection middleware for server actions
 */
export async function validateCSRF(): Promise<void> {
  try {
    const providedToken = await CSRFProtection.getTokenFromRequest();
    
    if (!providedToken) {
      throw createAuthenticationError(
        'CSRF token missing',
        true,
        'Please refresh the page and try again'
      );
    }

    const isValid = await CSRFProtection.validateToken(providedToken);
    
    if (!isValid) {
      throw createAuthenticationError(
        'Invalid CSRF token',
        true,
        'Please refresh the page and try again'
      );
    }
  } catch (error) {
    if ((error as { code?: string })?.code === 'AUTHENTICATION_ERROR') {
      throw error;
    }
    
    console.error('CSRF validation error:', error);
    throw createAuthenticationError(
      'CSRF validation failed',
      true,
      'Please refresh the page and try again'
    );
  }
}

/**
 * Enhanced CSRF protection with user session validation
 */
export async function validateCSRFWithSession(): Promise<void> {
  try {
    // First validate CSRF token
    await validateCSRF();
    
    // Then validate user session
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw createAuthenticationError(
        'Invalid session',
        true,
        'Please log in again'
      );
    }

    // Check if session is still valid
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw createAuthenticationError(
        'Session expired',
        true,
        'Please log in again'
      );
    }

    // Check session age (optional - implement based on your requirements)
    const sessionAge = Date.now() - new Date(session.expires_at || 0).getTime();
    const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (sessionAge > maxSessionAge) {
      throw createAuthenticationError(
        'Session too old',
        true,
        'Please log in again'
      );
    }
  } catch (error) {
    if ((error as { code?: string })?.code === 'AUTHENTICATION_ERROR') {
      throw error;
    }
    
    console.error('CSRF with session validation error:', error);
    throw createAuthenticationError(
      'Authentication validation failed',
      true,
      'Please refresh the page and try again'
    );
  }
}

/**
 * Wrapper for server actions with CSRF protection
 */
export function withCSRFProtection<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  requireSession: boolean = true
) {
  return async (...args: T): Promise<R> => {
    if (requireSession) {
      await validateCSRFWithSession();
    } else {
      await validateCSRF();
    }
    
    return fn(...args);
  };
}

/**
 * Generate CSRF token for client-side use
 */
export async function generateCSRFToken(): Promise<{ token: string; cookie: string }> {
  const token = CSRFProtection.generateToken();
  const cookie = CSRFProtection.createTokenCookie(token);
  
  return { token, cookie };
}
