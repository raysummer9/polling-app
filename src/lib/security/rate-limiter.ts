import { NextRequest } from 'next/server';

// In-memory rate limiter (for development)
// In production, use Redis or similar persistent store
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  private cleanup() {
    const now = Date.now();
    const entries = Array.from(this.store.entries());
    for (const [key, entry] of entries) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  async limit(
    identifier: string,
    limit: number = 10,
    windowMs: number = 60000
  ): Promise<{ success: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const key = identifier;
    const entry = this.store.get(key);

    if (!entry || entry.resetTime < now) {
      // First request or window expired
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return {
        success: true,
        remaining: limit - 1,
        resetTime: now + windowMs,
      };
    }

    if (entry.count >= limit) {
      // Rate limit exceeded
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime,
      };
    }

    // Increment counter
    entry.count++;
    this.store.set(key, entry);

    return {
      success: true,
      remaining: limit - entry.count,
      resetTime: entry.resetTime,
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Global rate limiter instance
const rateLimiter = new InMemoryRateLimiter();

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  // Authentication endpoints - stricter limits
  auth: {
    login: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    register: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
    passwordReset: { limit: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  },
  // Poll operations - moderate limits
  polls: {
    create: { limit: 10, windowMs: 60 * 1000 }, // 10 polls per minute
    vote: { limit: 20, windowMs: 60 * 1000 }, // 20 votes per minute
    update: { limit: 30, windowMs: 60 * 1000 }, // 30 updates per minute
    delete: { limit: 10, windowMs: 60 * 1000 }, // 10 deletes per minute
  },
  // General API endpoints
  general: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute
} as const;

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from headers (be careful with spoofing)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  // Use the first IP in the chain if forwarded
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : realIp;
  
  // Fallback to connection IP or a default
  return clientIp || 'unknown';
}

/**
 * Apply rate limiting to a request
 */
export async function applyRateLimit(
  request: NextRequest,
  type: keyof typeof RATE_LIMITS,
  endpoint?: string
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
  const identifier = getClientIdentifier(request);
  
  // Get rate limit configuration
  let config: { limit: number; windowMs: number } = RATE_LIMITS.general;
  if (type === 'auth' && endpoint) {
    config = RATE_LIMITS.auth[endpoint as keyof typeof RATE_LIMITS.auth] || RATE_LIMITS.auth.login;
  } else if (type === 'polls' && endpoint) {
    config = RATE_LIMITS.polls[endpoint as keyof typeof RATE_LIMITS.polls] || RATE_LIMITS.polls.vote;
  }

  return await rateLimiter.limit(
    `${identifier}:${type}:${endpoint || 'default'}`,
    config.limit,
    config.windowMs
  );
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(
  remaining: number,
  resetTime: number
): Response {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime.toString(),
      },
    }
  );
}

/**
 * Rate limiting middleware for Next.js
 */
export async function rateLimitMiddleware(
  request: NextRequest,
  type: keyof typeof RATE_LIMITS,
  endpoint?: string
): Promise<Response | null> {
  try {
    const result = await applyRateLimit(request, type, endpoint);
    
    if (!result.success) {
      return createRateLimitResponse(result.remaining, result.resetTime);
    }
    
    // Add rate limit headers to successful requests
    const response = new Response();
    response.headers.set('X-RateLimit-Limit', '10');
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
    
    return null; // Continue processing
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open - don't block requests if rate limiting fails
    return null;
  }
}

/**
 * Server action rate limiting wrapper
 */
export function withRateLimit<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  type: keyof typeof RATE_LIMITS,
  endpoint?: string
) {
  return async (...args: T): Promise<R> => {
    // Note: In server actions, we don't have direct access to NextRequest
    // This is a simplified version - in production, you'd want to implement
    // this differently or use a different approach for server actions
    
    // For now, we'll implement basic rate limiting using headers
    const { headers } = await import('next/headers');
    const headersList = await headers();
    
    // Create a mock request object for rate limiting
    const mockRequest = {
      headers: {
        get: (name: string) => headersList.get(name),
      },
    } as unknown as NextRequest;
    
    const result = await applyRateLimit(mockRequest, type, endpoint);
    
    if (!result.success) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    return fn(...args);
  };
}
