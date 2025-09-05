// Standardized error types for the application
export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: string;
  context?: Record<string, any>;
}

export interface ValidationError extends AppError {
  code: 'VALIDATION_ERROR';
  fieldErrors: Record<string, string[]>;
}

export interface AuthenticationError extends AppError {
  code: 'AUTHENTICATION_ERROR';
  required: boolean;
}

export interface AuthorizationError extends AppError {
  code: 'AUTHORIZATION_ERROR';
  resource: string;
  action: string;
}

export interface NotFoundError extends AppError {
  code: 'NOT_FOUND';
  resource: string;
  identifier: string;
}

export interface DatabaseError extends AppError {
  code: 'DATABASE_ERROR';
  operation: string;
  table?: string;
}

export interface RateLimitError extends AppError {
  code: 'RATE_LIMIT_EXCEEDED';
  retryAfter: number;
}

// Error factory functions
export function createAppError(
  code: string,
  message: string,
  details?: string,
  context?: Record<string, any>
): AppError {
  return {
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
    context,
  };
}

/**
 * Sanitizes error messages to prevent information disclosure
 */
export function sanitizeErrorMessage(
  error: unknown,
  operation: string,
  userFacing: boolean = true
): { message: string; details: string; code: string } {
  // Log the full error for debugging (server-side only)
  if (!userFacing) {
    console.error(`[${operation}] Full error:`, error);
  }

  // Determine error type and provide safe user-facing messages
  if ((error as { code?: string })?.code === 'PGRST116') {
    return {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
      details: 'Please check your request and try again',
    };
  }

  if ((error as { code?: string })?.code?.startsWith('23')) { // PostgreSQL constraint violations
    return {
      code: 'VALIDATION_ERROR',
      message: 'The request contains invalid data',
      details: 'Please check your input and try again',
    };
  }

  if ((error as { code?: string })?.code?.startsWith('42')) { // PostgreSQL syntax errors
    return {
      code: 'DATABASE_ERROR',
      message: 'A database error occurred',
      details: 'Please try again later',
    };
  }

  if ((error as { message?: string })?.message?.includes('duplicate key')) {
    return {
      code: 'CONFLICT',
      message: 'This resource already exists',
      details: 'Please use different data and try again',
    };
  }

  if ((error as { message?: string })?.message?.includes('permission denied')) {
    return {
      code: 'AUTHORIZATION_ERROR',
      message: 'You do not have permission to perform this action',
      details: 'Please contact an administrator if you believe this is an error',
    };
  }

  if ((error as { message?: string })?.message?.includes('timeout')) {
    return {
      code: 'TIMEOUT_ERROR',
      message: 'The request timed out',
      details: 'Please try again later',
    };
  }

  // Generic fallback for unknown errors
  return {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    details: 'Please try again later or contact support if the problem persists',
  };
}

export function createValidationError(
  message: string,
  fieldErrors: Record<string, string[]>,
  details?: string
): ValidationError {
  return {
    ...createAppError('VALIDATION_ERROR', message, details),
    code: 'VALIDATION_ERROR',
    fieldErrors,
  };
}

export function createAuthenticationError(
  message: string,
  required: boolean = true,
  details?: string
): AuthenticationError {
  return {
    ...createAppError('AUTHENTICATION_ERROR', message, details),
    code: 'AUTHENTICATION_ERROR',
    required,
  };
}

export function createAuthorizationError(
  message: string,
  resource: string,
  action: string,
  details?: string
): AuthorizationError {
  return {
    ...createAppError('AUTHORIZATION_ERROR', message, details),
    code: 'AUTHORIZATION_ERROR',
    resource,
    action,
  };
}

export function createNotFoundError(
  resource: string,
  identifier: string,
  details?: string
): NotFoundError {
  return {
    ...createAppError('NOT_FOUND', `Resource not found: ${resource}`, details),
    code: 'NOT_FOUND',
    resource,
    identifier,
  };
}

export function createDatabaseError(
  message: string,
  operation: string,
  table?: string,
  _details?: string
): DatabaseError {
  // Sanitize the error message for user-facing responses
  const sanitized = sanitizeErrorMessage({ message, code: 'DATABASE_ERROR' }, operation, true);
  
  return {
    ...createAppError('DATABASE_ERROR', sanitized.message, sanitized.details),
    code: 'DATABASE_ERROR',
    operation,
    table,
  };
}

export function createRateLimitError(
  message: string,
  retryAfter: number,
  details?: string
): RateLimitError {
  return {
    ...createAppError('RATE_LIMIT_EXCEEDED', message, details),
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter,
  };
}

// Error response wrapper
export interface ErrorResponse {
  success: false;
  error: AppError;
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// Helper function to create standardized responses
export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

export function createErrorResponse(error: AppError): ErrorResponse {
  return {
    success: false,
    error,
  };
}

// Type guard to check if response is an error
export function isErrorResponse(response: ApiResponse): response is ErrorResponse {
  return !response.success;
}

// Type guard to check if response is successful
export function isSuccessResponse<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.success;
}
