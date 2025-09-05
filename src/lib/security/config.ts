/**
 * Security configuration for the polling application
 */

export const SECURITY_CONFIG = {
  // Rate limiting configuration
  rateLimiting: {
    // Authentication endpoints
    auth: {
      login: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
      register: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
      passwordReset: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
    },
    // Poll operations
    polls: {
      create: { limit: 10, windowMs: 60 * 1000 }, // 10 polls per minute
      vote: { limit: 20, windowMs: 60 * 1000 }, // 20 votes per minute
      update: { limit: 30, windowMs: 60 * 1000 }, // 30 updates per minute
      delete: { limit: 10, windowMs: 60 * 1000 }, // 10 deletes per minute
    },
    // General API endpoints
    general: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  },

  // Session management
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxIdleTime: 2 * 60 * 60 * 1000, // 2 hours
    refreshThreshold: 30 * 60 * 1000, // 30 minutes
  },

  // CSRF protection
  csrf: {
    tokenLength: 32,
    cookieName: 'csrf-token',
    headerName: 'x-csrf-token',
    cookieOptions: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 3600, // 1 hour
    },
  },

  // Security headers
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co;",
  },

  // Password requirements
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxLength: 128,
  },

  // Input validation
  validation: {
    poll: {
      title: { minLength: 1, maxLength: 200 },
      description: { maxLength: 1000 },
      maxOptions: 10,
      minOptions: 2,
    },
    option: {
      text: { minLength: 1, maxLength: 100 },
    },
  },

  // Logging
  logging: {
    enabled: true,
    logLevel: 'info' as const,
    logSecurityEvents: true,
    logRateLimitHits: true,
    logAuthenticationEvents: true,
  },
} as const;

/**
 * Environment-specific security overrides
 */
export function getSecurityConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';

  if (isDevelopment) {
    return {
      ...SECURITY_CONFIG,
      // Relaxed settings for development
      rateLimiting: {
        ...SECURITY_CONFIG.rateLimiting,
        general: { limit: 1000, windowMs: 60 * 1000 }, // More lenient
      },
      csrf: {
        ...SECURITY_CONFIG.csrf,
        cookieOptions: {
          ...SECURITY_CONFIG.csrf.cookieOptions,
          secure: false, // Allow HTTP in development
        },
      },
    };
  }

  if (isProduction) {
    return {
      ...SECURITY_CONFIG,
      // Stricter settings for production
      rateLimiting: {
        ...SECURITY_CONFIG.rateLimiting,
        auth: {
          login: { limit: 3, windowMs: 15 * 60 * 1000 }, // Stricter
          register: { limit: 2, windowMs: 60 * 60 * 1000 }, // Stricter
          passwordReset: { limit: 2, windowMs: 60 * 60 * 1000 }, // Stricter
        },
      },
    };
  }

  return SECURITY_CONFIG;
}
