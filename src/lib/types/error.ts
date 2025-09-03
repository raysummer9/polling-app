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

export function createValidationError(
  message: string,
  fieldErrors: Record<string, string[]>,
  details?: string
): ValidationError {
  return {
    ...createAppError('VALIDATION_ERROR', message, details),
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
    resource,
    identifier,
  };
}

export function createDatabaseError(
  message: string,
  operation: string,
  table?: string,
  details?: string
): DatabaseError {
  return {
    ...createAppError('DATABASE_ERROR', message, details),
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
    retryAfter,
  };
}

// Error response wrapper
export interface ErrorResponse {
  success: false;
  error: AppError;
}

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

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
