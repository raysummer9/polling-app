import { CSRFProtection } from '../csrf';
import { SessionManager } from '../session';
import { sanitizeErrorMessage } from '../../types/error';

describe('Security Features', () => {
  describe('CSRF Protection', () => {
    test('should generate valid CSRF tokens', () => {
      const token1 = CSRFProtection.generateToken();
      const token2 = CSRFProtection.generateToken();
      
      expect(token1).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(token2).toHaveLength(64);
      expect(token1).not.toBe(token2);
    });

    test('should validate CSRF tokens correctly', async () => {
      const token = CSRFProtection.generateToken();
      
      // Mock cookie token
      const mockGetTokenFromCookies = jest.spyOn(CSRFProtection, 'getTokenFromCookies');
      mockGetTokenFromCookies.mockResolvedValue(token);
      
      const isValid = await CSRFProtection.validateToken(token);
      expect(isValid).toBe(true);
      
      mockGetTokenFromCookies.mockRestore();
    });

    test('should reject invalid CSRF tokens', async () => {
      const validToken = CSRFProtection.generateToken();
      const invalidToken = 'invalid-token';
      
      // Mock cookie token
      const mockGetTokenFromCookies = jest.spyOn(CSRFProtection, 'getTokenFromCookies');
      mockGetTokenFromCookies.mockResolvedValue(validToken);
      
      const isValid = await CSRFProtection.validateToken(invalidToken);
      expect(isValid).toBe(false);
      
      mockGetTokenFromCookies.mockRestore();
    });
  });

  describe('Error Message Sanitization', () => {
    test('should sanitize database errors', () => {
      const dbError = { code: 'PGRST116', message: 'Row not found' };
      const sanitized = sanitizeErrorMessage(dbError, 'testOperation', true);
      
      expect(sanitized.code).toBe('NOT_FOUND');
      expect(sanitized.message).toBe('The requested resource was not found');
      expect(sanitized.details).toBe('Please check your request and try again');
    });

    test('should sanitize constraint violation errors', () => {
      const constraintError = { code: '23505', message: 'duplicate key value violates unique constraint' };
      const sanitized = sanitizeErrorMessage(constraintError, 'testOperation', true);
      
      expect(sanitized.code).toBe('VALIDATION_ERROR');
      expect(sanitized.message).toBe('The request contains invalid data');
    });

    test('should sanitize permission errors', () => {
      const permissionError = { message: 'permission denied for table polls' };
      const sanitized = sanitizeErrorMessage(permissionError, 'testOperation', true);
      
      expect(sanitized.code).toBe('AUTHORIZATION_ERROR');
      expect(sanitized.message).toBe('You do not have permission to perform this action');
    });

    test('should provide generic fallback for unknown errors', () => {
      const unknownError = { message: 'Some random error' };
      const sanitized = sanitizeErrorMessage(unknownError, 'testOperation', true);
      
      expect(sanitized.code).toBe('INTERNAL_ERROR');
      expect(sanitized.message).toBe('An unexpected error occurred');
    });
  });

  describe('Session Management', () => {
    test('should validate session age correctly', () => {
      const now = Date.now();
      const validSession = {
        expires_at: new Date(now + 3600000).toISOString(), // 1 hour from now
        created_at: new Date(now - 1800000).toISOString(), // 30 minutes ago
      };
      
      const sessionAge = now - new Date(validSession.expires_at).getTime();
      expect(sessionAge).toBeLessThan(SessionManager['MAX_SESSION_AGE']);
    });

    test('should detect expired sessions', () => {
      const now = Date.now();
      const expiredSession = {
        expires_at: new Date(now - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
        created_at: new Date(now - 26 * 60 * 60 * 1000).toISOString(), // 26 hours ago
      };
      
      const sessionAge = now - new Date(expiredSession.expires_at).getTime();
      expect(sessionAge).toBeGreaterThan(SessionManager['MAX_SESSION_AGE']);
    });
  });
});
