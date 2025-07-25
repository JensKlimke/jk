import { Request, Response } from 'express';
import { AuthController } from '../../src/controllers/AuthController';
import { AuthService } from '../../src/service/AuthService';

// Mock uuid for consistent testing
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'integration-test-uuid-123'),
}));

describe('Auth Integration Tests', () => {
  let authController: AuthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Create real instances (no mocking)
    authController = new AuthController();

    // Setup mock request
    mockRequest = {
      cookies: {},
      query: {},
      get: jest.fn(),
    };

    // Setup mock response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
    };
  });

  describe('Controller-Service Integration', () => {
    describe('Authentication Check Flow', () => {
      it('should authenticate user with valid cookie', () => {
        // Arrange
        mockRequest.cookies = { auth: 'valid-session-id' };

        // Act
        authController.checkAuth(
          mockRequest as Request,
          mockResponse as Response
        );

        // Assert - Controller should call service and handle response
        expect(mockResponse.set).toHaveBeenCalledWith('X-User-Id', 'user123');
        expect(mockResponse.set).toHaveBeenCalledWith('X-User-Role', 'admin');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.send).toHaveBeenCalledWith('Authenticated');
        expect(mockResponse.redirect).not.toHaveBeenCalled();
      });

      it('should redirect unauthenticated user with proper URL construction', () => {
        // Arrange
        mockRequest.cookies = {};
        (mockRequest.get as jest.Mock)
          .mockReturnValueOnce('https') // X-Forwarded-Proto
          .mockReturnValueOnce('app.example.com') // X-Forwarded-Host
          .mockReturnValueOnce('/dashboard'); // X-Original-URI

        // Act
        authController.checkAuth(
          mockRequest as Request,
          mockResponse as Response
        );

        // Assert - Should construct proper redirect URL
        expect(mockResponse.redirect).toHaveBeenCalledWith(
          302,
          'http://auth.localhost/auth/callback?state=https%3A%2F%2Fapp.example.com%2Fdashboard'
        );
        expect(mockResponse.set).not.toHaveBeenCalled();
        expect(mockResponse.status).not.toHaveBeenCalled();
        expect(mockResponse.send).not.toHaveBeenCalled();
      });

      it('should handle complex URL encoding in redirect', () => {
        // Arrange
        mockRequest.cookies = {};
        (mockRequest.get as jest.Mock)
          .mockReturnValueOnce('https') // X-Forwarded-Proto
          .mockReturnValueOnce('api.example.com') // X-Forwarded-Host
          .mockReturnValueOnce('/api/users?filter=active&sort=name'); // X-Original-URI

        // Act
        authController.checkAuth(
          mockRequest as Request,
          mockResponse as Response
        );

        // Assert - Should properly encode complex URLs
        expect(mockResponse.redirect).toHaveBeenCalledWith(
          302,
          'http://auth.localhost/auth/callback?state=https%3A%2F%2Fapi.example.com%2Fapi%2Fusers%3Ffilter%3Dactive%26sort%3Dname'
        );
      });
    });

    describe('Callback Handling Flow', () => {
      it('should handle callback with encoded state and generate session', () => {
        // Arrange
        const encodedState = 'https%3A%2F%2Fapp.example.com%2Fdashboard';
        mockRequest.query = { state: encodedState };

        // Act
        authController.handleCallback(
          mockRequest as Request,
          mockResponse as Response
        );

        // Assert - Should decode state, generate session, set cookie, and redirect
        expect(mockResponse.cookie).toHaveBeenCalledWith(
          'auth',
          'integration-test-uuid-123',
          {
            maxAge: 24 * 60 * 60 * 1000,
            secure: false,
            httpOnly: true,
            domain: '.localhost',
            sameSite: 'lax',
          }
        );
        expect(mockResponse.redirect).toHaveBeenCalledWith(
          302,
          'https://app.example.com/dashboard'
        );
      });

      it('should handle callback without state parameter', () => {
        // Arrange
        mockRequest.query = {};

        // Act
        authController.handleCallback(
          mockRequest as Request,
          mockResponse as Response
        );

        // Assert - Should use default origin URL
        expect(mockResponse.cookie).toHaveBeenCalledWith(
          'auth',
          'integration-test-uuid-123',
          expect.objectContaining({
            maxAge: 24 * 60 * 60 * 1000,
            secure: false,
            httpOnly: true,
            domain: '.localhost',
            sameSite: 'lax',
          })
        );
        expect(mockResponse.redirect).toHaveBeenCalledWith(302, '/');
      });

      it('should handle complex encoded URLs in callback', () => {
        // Arrange
        const complexEncodedState =
          'https%3A%2F%2Fapi.example.com%2Fapi%2Fusers%3Ffilter%3Dactive%26sort%3Dname%23section1';
        mockRequest.query = { state: complexEncodedState };

        // Act
        authController.handleCallback(
          mockRequest as Request,
          mockResponse as Response
        );

        // Assert - Should properly decode complex URLs
        expect(mockResponse.redirect).toHaveBeenCalledWith(
          302,
          'https://api.example.com/api/users?filter=active&sort=name#section1'
        );
      });
    });

    describe('Full Authentication Cycle', () => {
      it('should complete full auth cycle: unauthenticated -> callback -> authenticated', () => {
        // Step 1: Initial auth check (unauthenticated)
        mockRequest.cookies = {};
        (mockRequest.get as jest.Mock)
          .mockReturnValueOnce('https') // X-Forwarded-Proto
          .mockReturnValueOnce('app.example.com') // X-Forwarded-Host
          .mockReturnValueOnce('/dashboard'); // X-Original-URI

        authController.checkAuth(
          mockRequest as Request,
          mockResponse as Response
        );

        // Verify redirect was called
        expect(mockResponse.redirect).toHaveBeenCalledWith(
          302,
          'http://auth.localhost/auth/callback?state=https%3A%2F%2Fapp.example.com%2Fdashboard'
        );

        // Reset mocks for next step
        jest.clearAllMocks();
        mockResponse = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis(),
          redirect: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          cookie: jest.fn().mockReturnThis(),
        };

        // Step 2: Handle callback
        mockRequest.query = {
          state: 'https%3A%2F%2Fapp.example.com%2Fdashboard',
        };
        authController.handleCallback(
          mockRequest as Request,
          mockResponse as Response
        );

        // Verify cookie was set and redirect happened
        expect(mockResponse.cookie).toHaveBeenCalledWith(
          'auth',
          'integration-test-uuid-123',
          expect.any(Object)
        );
        expect(mockResponse.redirect).toHaveBeenCalledWith(
          302,
          'https://app.example.com/dashboard'
        );

        // Reset mocks for final step
        jest.clearAllMocks();
        mockResponse = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis(),
          redirect: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          cookie: jest.fn().mockReturnThis(),
        };

        // Step 3: Subsequent auth check (now authenticated)
        mockRequest.cookies = { auth: 'integration-test-uuid-123' };
        authController.checkAuth(
          mockRequest as Request,
          mockResponse as Response
        );

        // Verify authenticated response
        expect(mockResponse.set).toHaveBeenCalledWith('X-User-Id', 'user123');
        expect(mockResponse.set).toHaveBeenCalledWith('X-User-Role', 'admin');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.send).toHaveBeenCalledWith('Authenticated');
      });
    });

    describe('Error Handling Integration', () => {
      it('should handle service errors gracefully in checkAuth', () => {
        // Arrange - Create a scenario that might cause service errors
        mockRequest.cookies = {};
        (mockRequest.get as jest.Mock).mockImplementation(() => {
          throw new Error('Header parsing error');
        });

        // Act
        authController.checkAuth(
          mockRequest as Request,
          mockResponse as Response
        );

        // Assert - Should handle error and return 500
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.send).toHaveBeenCalledWith('Internal Server Error');
      });

      it('should handle service errors gracefully in handleCallback', () => {
        // Arrange - Create a scenario that might cause service errors
        mockRequest.query = { state: 'invalid%state%encoding' };

        // Act
        authController.handleCallback(
          mockRequest as Request,
          mockResponse as Response
        );

        // Assert - Malformed URL encoding causes decodeURIComponent to throw an error
        // The controller should catch this and return a 500 error
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.send).toHaveBeenCalledWith('Internal Server Error');
        expect(mockResponse.cookie).not.toHaveBeenCalled();
        expect(mockResponse.redirect).not.toHaveBeenCalled();
      });
    });
  });

  describe('Service Internal Logic Integration', () => {
    let authService: AuthService;

    beforeEach(() => {
      authService = new AuthService();
    });

    it('should maintain consistent behavior between service methods', () => {
      // Test that buildOriginUrl and handleAuthCallback work together consistently

      // Step 1: Service generates redirect URL
      mockRequest.cookies = {};
      (mockRequest.get as jest.Mock)
        .mockReturnValueOnce('https')
        .mockReturnValueOnce('app.example.com')
        .mockReturnValueOnce('/dashboard');

      const authResult = authService.checkAuthentication(
        mockRequest as Request
      );
      expect(authResult.isAuthenticated).toBe(false);
      expect(authResult.redirectUrl).toBe(
        'http://auth.localhost/auth/callback?state=https%3A%2F%2Fapp.example.com%2Fdashboard'
      );

      // Step 2: Extract state from redirect URL and use in callback
      const stateMatch = authResult.redirectUrl!.match(/state=([^&]+)/);
      const state = stateMatch ? stateMatch[1] : '';

      const callbackResult = authService.handleAuthCallback(state);
      expect(callbackResult.originUrl).toBe(
        'https://app.example.com/dashboard'
      );
      expect(callbackResult.sessionId).toBe('integration-test-uuid-123');
    });

    it('should handle edge cases consistently across methods', () => {
      // Test with missing headers
      mockRequest.cookies = {};
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);

      const authResult = authService.checkAuthentication(
        mockRequest as Request
      );
      expect(authResult.redirectUrl).toContain('http%3A%2F%2Fundefined%2F');

      // Test callback with the generated state
      const stateMatch = authResult.redirectUrl!.match(/state=([^&]+)/);
      const state = stateMatch ? stateMatch[1] : '';

      const callbackResult = authService.handleAuthCallback(state);
      expect(callbackResult.originUrl).toBe('http://undefined/');
    });
  });
});
