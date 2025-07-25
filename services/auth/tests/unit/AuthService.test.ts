import { Request } from 'express';
import { AuthService, AuthResult } from '../../src/service/AuthService';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    authService = new AuthService();
    mockRequest = {
      cookies: {},
      get: jest.fn(),
    };
  });

  describe('checkAuthentication', () => {
    it('should return authenticated result when auth cookie is present', () => {
      // Arrange
      mockRequest.cookies = { auth: 'valid-session-id' };

      // Act
      const result: AuthResult = authService.checkAuthentication(
        mockRequest as Request
      );

      // Assert
      expect(result.isAuthenticated).toBe(true);
      expect(result.userId).toBe('user123');
      expect(result.userRole).toBe('admin');
      expect(result.redirectUrl).toBeUndefined();
    });

    it('should return unauthenticated result with redirect URL when auth cookie is missing', () => {
      // Arrange
      mockRequest.cookies = {};
      (mockRequest.get as jest.Mock)
        .mockReturnValueOnce('https') // X-Forwarded-Proto
        .mockReturnValueOnce('app.example.com') // X-Forwarded-Host
        .mockReturnValueOnce('/dashboard'); // X-Original-URI

      // Act
      const result: AuthResult = authService.checkAuthentication(
        mockRequest as Request
      );

      // Assert
      expect(result.isAuthenticated).toBe(false);
      expect(result.userId).toBeUndefined();
      expect(result.userRole).toBeUndefined();
      expect(result.redirectUrl).toBe(
        'http://auth.localhost/auth/callback?state=https%3A%2F%2Fapp.example.com%2Fdashboard'
      );
    });

    it('should handle missing forwarded headers gracefully', () => {
      // Arrange
      mockRequest.cookies = {};
      (mockRequest.get as jest.Mock)
        .mockReturnValueOnce(undefined) // X-Forwarded-Proto
        .mockReturnValueOnce('localhost:3000') // host header fallback
        .mockReturnValueOnce(undefined); // X-Original-URI

      // Act
      const result: AuthResult = authService.checkAuthentication(
        mockRequest as Request
      );

      // Assert
      expect(result.isAuthenticated).toBe(false);
      expect(result.redirectUrl).toBe(
        'http://auth.localhost/auth/callback?state=http%3A%2F%2Flocalhost%3A3000%2F'
      );
    });

    it('should use default values when all headers are missing', () => {
      // Arrange
      mockRequest.cookies = {};
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);

      // Act
      const result: AuthResult = authService.checkAuthentication(
        mockRequest as Request
      );

      // Assert
      expect(result.isAuthenticated).toBe(false);
      expect(result.redirectUrl).toBe(
        'http://auth.localhost/auth/callback?state=http%3A%2F%2Fundefined%2F'
      );
    });
  });

  describe('handleAuthCallback', () => {
    it('should generate session with provided state', () => {
      // Arrange
      const state = 'https%3A%2F%2Fapp.example.com%2Fdashboard';

      // Act
      const result = authService.handleAuthCallback(state);

      // Assert
      expect(result.sessionId).toBe('mock-uuid-123');
      expect(result.originUrl).toBe('https://app.example.com/dashboard');
      expect(result.cookieOptions).toEqual({
        maxAge: 24 * 60 * 60 * 1000,
        secure: false,
        httpOnly: true,
        domain: '.localhost',
        sameSite: 'lax',
      });
    });

    it('should use default origin URL when state is not provided', () => {
      // Act
      const result = authService.handleAuthCallback();

      // Assert
      expect(result.sessionId).toBe('mock-uuid-123');
      expect(result.originUrl).toBe('/');
      expect(result.cookieOptions).toBeDefined();
    });

    it('should use default origin URL when state is empty string', () => {
      // Act
      const result = authService.handleAuthCallback('');

      // Assert
      expect(result.sessionId).toBe('mock-uuid-123');
      expect(result.originUrl).toBe('/');
    });

    it('should generate unique session ID for each call', () => {
      // Arrange
      const { v4: mockUuid } = require('uuid');
      (mockUuid as jest.Mock)
        .mockReturnValueOnce('session-1')
        .mockReturnValueOnce('session-2');

      // Act
      const result1 = authService.handleAuthCallback();
      const result2 = authService.handleAuthCallback();

      // Assert
      expect(result1.sessionId).toBe('session-1');
      expect(result2.sessionId).toBe('session-2');
    });

    it('should return correct cookie options', () => {
      // Act
      const result = authService.handleAuthCallback();

      // Assert
      expect(result.cookieOptions).toEqual({
        maxAge: 86400000, // 24 hours in milliseconds
        secure: false,
        httpOnly: true,
        domain: '.localhost',
        sameSite: 'lax',
      });
    });
  });

  describe('buildOriginUrl (private method testing through public methods)', () => {
    it('should build URL with all forwarded headers', () => {
      // Arrange
      mockRequest.cookies = {};
      (mockRequest.get as jest.Mock)
        .mockReturnValueOnce('https') // X-Forwarded-Proto
        .mockReturnValueOnce('api.example.com') // X-Forwarded-Host
        .mockReturnValueOnce('/api/users'); // X-Original-URI

      // Act
      const result = authService.checkAuthentication(mockRequest as Request);

      // Assert
      expect(result.redirectUrl).toContain(
        'https%3A%2F%2Fapi.example.com%2Fapi%2Fusers'
      );
    });

    it('should fallback to host header when X-Forwarded-Host is missing', () => {
      // Arrange
      mockRequest.cookies = {};
      (mockRequest.get as jest.Mock).mockImplementation((header: string) => {
        switch (header) {
          case 'X-Forwarded-Proto':
            return 'http';
          case 'X-Forwarded-Host':
            return undefined;
          case 'host':
            return 'localhost:8080';
          case 'X-Original-URI':
            return '/test';
          default:
            return undefined;
        }
      });

      // Act
      const result = authService.checkAuthentication(mockRequest as Request);

      // Assert
      expect(result.redirectUrl).toContain(
        'http%3A%2F%2Flocalhost%3A8080%2Ftest'
      );
    });
  });
});
