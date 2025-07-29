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
    it('should set cookie and redirect to origin URL', async () => {
      // Arrange
      const code = 'github-auth-code';
      const state = 'https%3A%2F%2Fapp.example.com%2Fdashboard';
      mockRequest.query = { code, state };

      const callbackResult = {
        sessionId: 'session-123',
        originUrl: 'https://app.example.com/dashboard',
        cookieOptions: {
          maxAge: 86400000,
          secure: false,
          httpOnly: true,
          domain: '.localhost',
          sameSite: 'lax' as const,
          signed: true,
        },
      };
      mockAuthService.handleAuthCallback.mockResolvedValue(callbackResult);

      // Act
      await authController.handleCallback(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.handleAuthCallback).toHaveBeenCalledWith(code, state);
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

    it('should handle missing state parameter', async () => {
      // Arrange
      const code = 'github-auth-code';
      mockRequest.query = { code };

      const callbackResult = {
        sessionId: 'session-456',
        originUrl: '/',
        cookieOptions: {
          maxAge: 86400000,
          secure: false,
          httpOnly: true,
          domain: '.localhost',
          sameSite: 'lax' as const,
          signed: true,
        },
      };
      mockAuthService.handleAuthCallback.mockResolvedValue(callbackResult);

      // Act
      await authController.handleCallback(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.handleAuthCallback).toHaveBeenCalledWith(
        code,
        undefined
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'auth',
        'session-456',
        callbackResult.cookieOptions
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(302, '/');
    });

    it('should return 400 when code parameter is missing', async () => {
      // Arrange
      mockRequest.query = { state: 'some-state' };

      // Act
      await authController.handleCallback(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.handleAuthCallback).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith('Authorization code not provided');
    });

    it('should handle errors and return 500', async () => {
      // Arrange
      const code = 'github-auth-code';
      const state = 'valid-state';
      mockRequest.query = { code, state };

      const error = new Error('GitHub authentication failed');
      mockAuthService.handleAuthCallback.mockRejectedValue(error);

      // Act
      await authController.handleCallback(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.handleAuthCallback).toHaveBeenCalledWith(code, state);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith('GitHub authentication failed');
      expect(mockResponse.cookie).not.toHaveBeenCalled();
      expect(mockResponse.redirect).not.toHaveBeenCalled();
    });

    it('should handle empty string state', async () => {
      // Arrange
      const code = 'github-auth-code';
      mockRequest.query = { code, state: '' };

      const callbackResult = {
        sessionId: 'session-empty',
        originUrl: '/',
        cookieOptions: {
          maxAge: 86400000,
          secure: false,
          httpOnly: true,
          domain: '.localhost',
          sameSite: 'lax' as const,
          signed: true,
        },
      };
      mockAuthService.handleAuthCallback.mockResolvedValue(callbackResult);

      // Act
      await authController.handleCallback(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockAuthService.handleAuthCallback).toHaveBeenCalledWith(code, '');
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'auth',
        'session-empty',
        callbackResult.cookieOptions
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(302, '/');
    });
  });
});
