import { Request, Response } from 'express';
import { AuthController } from '../../src/controllers/AuthController';
import { AuthService } from '../../src/service/AuthService';
import axios from 'axios';

// Mock uuid for consistent testing
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'integration-test-uuid-123'),
}));

// Mock axios for GitHub API calls
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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

    // Reset axios mocks
    mockedAxios.post.mockReset();
    mockedAxios.get.mockReset();
  });

  describe('Controller-Service Integration', () => {
    describe('Authentication Check Flow', () => {
      it('should authenticate user with valid cookie', async () => {
        // Arrange - First create a valid session through OAuth flow
        const mockGitHubUser = {
          id: 123,
          login: 'testuser',
          name: 'Test User',
          email: 'test@example.com',
          avatar_url: 'https://github.com/avatar.jpg'
        };
        
        mockedAxios.post.mockResolvedValueOnce({
          data: { access_token: 'mock-access-token' }
        });
        mockedAxios.get.mockResolvedValueOnce({
          data: mockGitHubUser
        });
        
        // Create session through callback
        mockRequest.query = { code: 'mock-code', state: 'test-state' };
        await authController.handleCallback(
          mockRequest as Request,
          mockResponse as Response
        );
        
        // Reset mocks for auth check
        jest.clearAllMocks();
        mockResponse = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis(),
          redirect: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          cookie: jest.fn().mockReturnThis(),
        };
        
        // Now test authentication with the session
        mockRequest.cookies = { auth: 'integration-test-uuid-123' };

        // Act
        authController.checkAuth(
          mockRequest as Request,
          mockResponse as Response
        );

        // Assert - Controller should call service and handle response
        expect(mockResponse.set).toHaveBeenCalledWith('X-User-Id', 'testuser');
        expect(mockResponse.set).toHaveBeenCalledWith('X-User-Role', 'user');
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.send).toHaveBeenCalledWith('Authenticated');
        expect(mockResponse.redirect).not.toHaveBeenCalled();
      });

      it('should redirect unauthenticated user to GitHub OAuth', () => {
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

        // Assert - Should redirect to GitHub OAuth with proper state
        const redirectCall = (mockResponse.redirect as jest.Mock).mock.calls[0];
        expect(redirectCall[0]).toBe(302);
        const redirectUrl = redirectCall[1];
        expect(redirectUrl).toContain('https://github.com/login/oauth/authorize');
        expect(redirectUrl).toContain('client_id=test-client-id');
        expect(redirectUrl).toContain('redirect_uri=http%3A%2F%2Fauth.localhost%2Fauth%2Fcallback');
        expect(redirectUrl).toContain('state=https%253A%252F%252Fapp.example.com%252Fdashboard');
        expect(mockResponse.set).not.toHaveBeenCalled();
        expect(mockResponse.status).not.toHaveBeenCalled();
        expect(mockResponse.send).not.toHaveBeenCalled();
      });

      it('should handle complex URL encoding in GitHub OAuth redirect', () => {
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

        // Assert - Should properly encode complex URLs in GitHub OAuth state
        const redirectCall = (mockResponse.redirect as jest.Mock).mock.calls[0];
        expect(redirectCall[0]).toBe(302);
        const redirectUrl = redirectCall[1];
        expect(redirectUrl).toContain('https://github.com/login/oauth/authorize');
        expect(redirectUrl).toContain('state=https%253A%252F%252Fapi.example.com%252Fapi%252Fusers%253Ffilter%253Dactive%2526sort%253Dname');
      });
    });

    describe('Callback Handling Flow', () => {
      it('should handle GitHub OAuth callback with encoded state and generate session', async () => {
        // Arrange
        const mockGitHubUser = {
          id: 456,
          login: 'integrationuser',
          name: 'Integration User',
          email: 'integration@example.com',
          avatar_url: 'https://github.com/integration-avatar.jpg'
        };
        
        mockedAxios.post.mockResolvedValueOnce({
          data: { access_token: 'integration-access-token' }
        });
        mockedAxios.get.mockResolvedValueOnce({
          data: mockGitHubUser
        });
        
        const encodedState = 'https%3A%2F%2Fapp.example.com%2Fdashboard';
        mockRequest.query = { code: 'github-auth-code', state: encodedState };

        // Act
        await authController.handleCallback(
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
        
        // Verify GitHub API calls
        expect(mockedAxios.post).toHaveBeenCalledWith(
          'https://github.com/login/oauth/access_token',
          {
            client_id: 'test-client-id',
            client_secret: 'test-client-secret',
            code: 'github-auth-code',
          },
          {
            headers: {
              Accept: 'application/json',
            },
          }
        );
        expect(mockedAxios.get).toHaveBeenCalledWith(
          'https://api.github.com/user',
          {
            headers: {
              Authorization: 'Bearer integration-access-token',
            },
          }
        );
      });

      it('should handle GitHub OAuth callback without state parameter', async () => {
        // Arrange
        const mockGitHubUser = {
          id: 789,
          login: 'nostatuser',
          name: 'No State User',
          email: 'nostate@example.com',
          avatar_url: 'https://github.com/nostate-avatar.jpg'
        };
        
        mockedAxios.post.mockResolvedValueOnce({
          data: { access_token: 'nostate-access-token' }
        });
        mockedAxios.get.mockResolvedValueOnce({
          data: mockGitHubUser
        });
        
        mockRequest.query = { code: 'github-auth-code' };

        // Act
        await authController.handleCallback(
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

      it('should handle complex encoded URLs in GitHub OAuth callback', async () => {
        // Arrange
        const mockGitHubUser = {
          id: 101112,
          login: 'complexuser',
          name: 'Complex User',
          email: 'complex@example.com',
          avatar_url: 'https://github.com/complex-avatar.jpg'
        };
        
        mockedAxios.post.mockResolvedValueOnce({
          data: { access_token: 'complex-access-token' }
        });
        mockedAxios.get.mockResolvedValueOnce({
          data: mockGitHubUser
        });
        
        const complexEncodedState =
          'https%3A%2F%2Fapi.example.com%2Fapi%2Fusers%3Ffilter%3Dactive%26sort%3Dname%23section1';
        mockRequest.query = { code: 'github-auth-code', state: complexEncodedState };

        // Act
        await authController.handleCallback(
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
      it('should complete full GitHub OAuth cycle: unauthenticated -> callback -> authenticated', async () => {
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

        // Verify GitHub OAuth redirect was called
        const redirectCall = (mockResponse.redirect as jest.Mock).mock.calls[0];
        expect(redirectCall[0]).toBe(302);
        const redirectUrl = redirectCall[1];
        expect(redirectUrl).toContain('https://github.com/login/oauth/authorize');
        expect(redirectUrl).toContain('state=https%253A%252F%252Fapp.example.com%252Fdashboard');

        // Reset mocks for next step
        jest.clearAllMocks();
        mockResponse = {
          status: jest.fn().mockReturnThis(),
          send: jest.fn().mockReturnThis(),
          redirect: jest.fn().mockReturnThis(),
          set: jest.fn().mockReturnThis(),
          cookie: jest.fn().mockReturnThis(),
        };

        // Step 2: Handle GitHub OAuth callback
        const mockGitHubUser = {
          id: 999,
          login: 'fullcycleuser',
          name: 'Full Cycle User',
          email: 'fullcycle@example.com',
          avatar_url: 'https://github.com/fullcycle-avatar.jpg'
        };
        
        mockedAxios.post.mockResolvedValueOnce({
          data: { access_token: 'fullcycle-access-token' }
        });
        mockedAxios.get.mockResolvedValueOnce({
          data: mockGitHubUser
        });
        
        mockRequest.query = {
          code: 'github-auth-code',
          state: 'https%3A%2F%2Fapp.example.com%2Fdashboard',
        };
        await authController.handleCallback(
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

        // Verify authenticated response with GitHub user data
        expect(mockResponse.set).toHaveBeenCalledWith('X-User-Id', 'fullcycleuser');
        expect(mockResponse.set).toHaveBeenCalledWith('X-User-Role', 'user');
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

      it('should handle service errors gracefully in handleCallback', async () => {
        // Arrange - Create a scenario that might cause service errors
        mockRequest.query = { code: 'valid-code', state: 'invalid%state%encoding' };
        
        // Mock GitHub API to fail
        mockedAxios.post.mockRejectedValueOnce(new Error('GitHub API error'));

        // Act
        await authController.handleCallback(
          mockRequest as Request,
          mockResponse as Response
        );

        // Assert - GitHub API error should be caught and return 500
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.send).toHaveBeenCalledWith('GitHub authentication failed');
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

    it('should maintain consistent behavior between service methods', async () => {
      // Test that buildOriginUrl and handleAuthCallback work together consistently

      // Step 1: Service generates GitHub OAuth redirect URL
      mockRequest.cookies = {};
      (mockRequest.get as jest.Mock)
        .mockReturnValueOnce('https')
        .mockReturnValueOnce('app.example.com')
        .mockReturnValueOnce('/dashboard');

      const authResult = authService.checkAuthentication(
        mockRequest as Request
      );
      expect(authResult.isAuthenticated).toBe(false);
      expect(authResult.redirectUrl).toContain('https://github.com/login/oauth/authorize');
      expect(authResult.redirectUrl).toContain('state=https%253A%252F%252Fapp.example.com%252Fdashboard');

      // Step 2: Extract state from redirect URL and use in callback
      const stateMatch = authResult.redirectUrl!.match(/state=([^&]+)/);
      const encodedState = stateMatch ? stateMatch[1] : '';
      const decodedState = decodeURIComponent(encodedState);

      // Mock GitHub API for callback
      const mockGitHubUser = {
        id: 12345,
        login: 'servicelogicuser',
        name: 'Service Logic User',
        email: 'servicelogic@example.com',
        avatar_url: 'https://github.com/servicelogic-avatar.jpg'
      };
      
      mockedAxios.post.mockResolvedValueOnce({
        data: { access_token: 'servicelogic-access-token' }
      });
      mockedAxios.get.mockResolvedValueOnce({
        data: mockGitHubUser
      });

      const callbackResult = await authService.handleAuthCallback('mock-code', decodedState);
      expect(callbackResult.originUrl).toBe(
        'https://app.example.com/dashboard'
      );
      expect(callbackResult.sessionId).toBe('integration-test-uuid-123');
    });

    it('should handle edge cases consistently across methods', async () => {
      // Test with missing headers
      mockRequest.cookies = {};
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);

      const authResult = authService.checkAuthentication(
        mockRequest as Request
      );
      expect(authResult.redirectUrl).toContain('https://github.com/login/oauth/authorize');
      expect(authResult.redirectUrl).toContain('state=http%253A%252F%252Fundefined%252F');

      // Test callback with the generated state
      const stateMatch = authResult.redirectUrl!.match(/state=([^&]+)/);
      const encodedState = stateMatch ? stateMatch[1] : '';
      const decodedState = decodeURIComponent(encodedState);

      // Mock GitHub API for callback
      const mockGitHubUser = {
        id: 67890,
        login: 'edgecaseuser',
        name: 'Edge Case User',
        email: 'edgecase@example.com',
        avatar_url: 'https://github.com/edgecase-avatar.jpg'
      };
      
      mockedAxios.post.mockResolvedValueOnce({
        data: { access_token: 'edgecase-access-token' }
      });
      mockedAxios.get.mockResolvedValueOnce({
        data: mockGitHubUser
      });

      const callbackResult = await authService.handleAuthCallback('mock-code', decodedState);
      expect(callbackResult.originUrl).toBe('http://undefined/');
    });
  });
});
