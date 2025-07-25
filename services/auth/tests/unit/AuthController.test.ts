import { Request, Response } from 'express';
import { AuthController } from '../../src/controllers/AuthController';
import { AuthService } from '../../src/service/AuthService';

// Mock the AuthService
jest.mock('../../src/service/AuthService');

describe('AuthController', () => {
  let authController: AuthController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create controller instance
    authController = new AuthController();

    // Get the mocked AuthService instance
    mockAuthService = (authController as any).authService;

    // Setup mock request
    mockRequest = {
      cookies: {},
      query: {},
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

  describe('checkAuth', () => {
    it('should return 200 with headers when user is authenticated', () => {
      // Arrange
      const authResult = {
        isAuthenticated: true,
        userId: 'user123',
        userRole: 'admin',
      };
      mockAuthService.checkAuthentication.mockReturnValue(authResult);

      // Act
      authController.checkAuth(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.checkAuthentication).toHaveBeenCalledWith(
        mockRequest
      );
      expect(mockResponse.set).toHaveBeenCalledWith('X-User-Id', 'user123');
      expect(mockResponse.set).toHaveBeenCalledWith('X-User-Role', 'admin');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith('Authenticated');
      expect(mockResponse.redirect).not.toHaveBeenCalled();
    });

    it('should redirect when user is not authenticated', () => {
      // Arrange
      const authResult = {
        isAuthenticated: false,
        redirectUrl:
          'http://auth.localhost/auth/callback?state=https%3A%2F%2Fapp.example.com%2Fdashboard',
      };
      mockAuthService.checkAuthentication.mockReturnValue(authResult);

      // Act
      authController.checkAuth(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.checkAuthentication).toHaveBeenCalledWith(
        mockRequest
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        302,
        authResult.redirectUrl
      );
      expect(mockResponse.set).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.send).not.toHaveBeenCalled();
    });

    it('should handle errors and return 500', () => {
      // Arrange
      const error = new Error('Service error');
      mockAuthService.checkAuthentication.mockImplementation(() => {
        throw error;
      });

      // Act
      authController.checkAuth(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.checkAuthentication).toHaveBeenCalledWith(
        mockRequest
      );
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith('Internal Server Error');
      expect(mockResponse.redirect).not.toHaveBeenCalled();
      expect(mockResponse.set).not.toHaveBeenCalled();
    });

    it('should handle missing userId gracefully', () => {
      // Arrange
      const authResult = {
        isAuthenticated: true,
        userId: undefined,
        userRole: 'admin',
      };
      mockAuthService.checkAuthentication.mockReturnValue(authResult);

      // Act
      authController.checkAuth(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.set).toHaveBeenCalledWith('X-User-Id', undefined);
      expect(mockResponse.set).toHaveBeenCalledWith('X-User-Role', 'admin');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith('Authenticated');
    });

    it('should handle missing userRole gracefully', () => {
      // Arrange
      const authResult = {
        isAuthenticated: true,
        userId: 'user123',
        userRole: undefined,
      };
      mockAuthService.checkAuthentication.mockReturnValue(authResult);

      // Act
      authController.checkAuth(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.set).toHaveBeenCalledWith('X-User-Id', 'user123');
      expect(mockResponse.set).toHaveBeenCalledWith('X-User-Role', undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith('Authenticated');
    });
  });

  describe('handleCallback', () => {
    it('should set cookie and redirect to origin URL', () => {
      // Arrange
      const state = 'https%3A%2F%2Fapp.example.com%2Fdashboard';
      mockRequest.query = { state };

      const callbackResult = {
        sessionId: 'session-123',
        originUrl: 'https://app.example.com/dashboard',
        cookieOptions: {
          maxAge: 86400000,
          secure: false,
          httpOnly: true,
          domain: '.localhost',
          sameSite: 'lax' as const,
        },
      };
      mockAuthService.handleAuthCallback.mockReturnValue(callbackResult);

      // Act
      authController.handleCallback(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.handleAuthCallback).toHaveBeenCalledWith(state);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'auth',
        'session-123',
        callbackResult.cookieOptions
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        302,
        'https://app.example.com/dashboard'
      );
    });

    it('should handle missing state parameter', () => {
      // Arrange
      mockRequest.query = {};

      const callbackResult = {
        sessionId: 'session-456',
        originUrl: '/',
        cookieOptions: {
          maxAge: 86400000,
          secure: false,
          httpOnly: true,
          domain: '.localhost',
          sameSite: 'lax' as const,
        },
      };
      mockAuthService.handleAuthCallback.mockReturnValue(callbackResult);

      // Act
      authController.handleCallback(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.handleAuthCallback).toHaveBeenCalledWith(
        undefined
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'auth',
        'session-456',
        callbackResult.cookieOptions
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(302, '/');
    });

    it('should handle state as array (edge case)', () => {
      // Arrange
      mockRequest.query = { state: ['first', 'second'] };

      const callbackResult = {
        sessionId: 'session-789',
        originUrl: '/',
        cookieOptions: {
          maxAge: 86400000,
          secure: false,
          httpOnly: true,
          domain: '.localhost',
          sameSite: 'lax' as const,
        },
      };
      mockAuthService.handleAuthCallback.mockReturnValue(callbackResult);

      // Act
      authController.handleCallback(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      // The controller passes the array as-is to the service, which handles it
      expect(mockAuthService.handleAuthCallback).toHaveBeenCalledWith([
        'first',
        'second',
      ]);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'auth',
        'session-789',
        callbackResult.cookieOptions
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(302, '/');
    });

    it('should handle errors and return 500', () => {
      // Arrange
      const state = 'valid-state';
      mockRequest.query = { state };

      const error = new Error('Callback service error');
      mockAuthService.handleAuthCallback.mockImplementation(() => {
        throw error;
      });

      // Act
      authController.handleCallback(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.handleAuthCallback).toHaveBeenCalledWith(state);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith('Internal Server Error');
      expect(mockResponse.cookie).not.toHaveBeenCalled();
      expect(mockResponse.redirect).not.toHaveBeenCalled();
    });

    it('should handle empty string state', () => {
      // Arrange
      mockRequest.query = { state: '' };

      const callbackResult = {
        sessionId: 'session-empty',
        originUrl: '/',
        cookieOptions: {
          maxAge: 86400000,
          secure: false,
          httpOnly: true,
          domain: '.localhost',
          sameSite: 'lax' as const,
        },
      };
      mockAuthService.handleAuthCallback.mockReturnValue(callbackResult);

      // Act
      authController.handleCallback(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.handleAuthCallback).toHaveBeenCalledWith('');
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'auth',
        'session-empty',
        callbackResult.cookieOptions
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(302, '/');
    });
  });
});
