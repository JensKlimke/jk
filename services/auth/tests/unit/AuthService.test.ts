import { Request } from 'express';
import { AuthService, AuthResult } from '../../src/service/AuthService';
import axios from 'axios';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-123'),
}));

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AuthService', () => {
  let authService: AuthService;
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    authService = new AuthService();
    mockRequest = {
      cookies: {},
      get: jest.fn(),
    };
    
    // Reset axios mocks
    mockedAxios.post.mockReset();
    mockedAxios.get.mockReset();
  });

  describe('constructor', () => {
    it('should throw error when GitHub client ID is missing', () => {
      // Arrange
      const originalClientId = process.env.GITHUB_CLIENT_ID;
      delete process.env.GITHUB_CLIENT_ID;

      // Act & Assert
      expect(() => new AuthService()).toThrow('GitHub OAuth credentials not configured');

      // Cleanup
      process.env.GITHUB_CLIENT_ID = originalClientId;
    });

    it('should throw error when GitHub client secret is missing', () => {
      // Arrange
      const originalClientSecret = process.env.GITHUB_CLIENT_SECRET;
      delete process.env.GITHUB_CLIENT_SECRET;

      // Act & Assert
      expect(() => new AuthService()).toThrow('GitHub OAuth credentials not configured');

      // Cleanup
      process.env.GITHUB_CLIENT_SECRET = originalClientSecret;
    });

    it('should throw error when GitHub client ID is empty string', () => {
      // Arrange
      const originalClientId = process.env.GITHUB_CLIENT_ID;
      process.env.GITHUB_CLIENT_ID = '';

      // Act & Assert
      expect(() => new AuthService()).toThrow('GitHub OAuth credentials not configured');

      // Cleanup
      process.env.GITHUB_CLIENT_ID = originalClientId;
    });

    it('should throw error when GitHub client secret is empty string', () => {
      // Arrange
      const originalClientSecret = process.env.GITHUB_CLIENT_SECRET;
      process.env.GITHUB_CLIENT_SECRET = '';

      // Act & Assert
      expect(() => new AuthService()).toThrow('GitHub OAuth credentials not configured');

      // Cleanup
      process.env.GITHUB_CLIENT_SECRET = originalClientSecret;
    });
  });

  describe('checkAuthentication', () => {
    it('should return authenticated result when auth cookie is present and session exists', async () => {
      // Arrange - First create a session by mocking the OAuth flow
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
      
      // Create a session first
      const callbackResult = await authService.handleAuthCallback('mock-code', 'test-state');
      const sessionId = callbackResult.sessionId;
      
      // Now test authentication with the session
      mockRequest.cookies = { auth: sessionId };

      // Act
      const result: AuthResult = authService.checkAuthentication(
        mockRequest as Request
      );

      // Assert
      expect(result.isAuthenticated).toBe(true);
      expect(result.userId).toBe('testuser');
      expect(result.userRole).toBe('user');
      expect(result.redirectUrl).toBeUndefined();
    });

    it('should return unauthenticated result with GitHub OAuth URL when auth cookie is missing', () => {
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
      expect(result.redirectUrl).toContain('https://github.com/login/oauth/authorize');
      expect(result.redirectUrl).toContain('client_id=test-client-id');
      expect(result.redirectUrl).toContain('redirect_uri=http%3A%2F%2Fauth.localhost%2Fauth%2Fcallback');
      expect(result.redirectUrl).toContain('state=https%253A%252F%252Fapp.example.com%252Fdashboard');
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
      expect(result.redirectUrl).toContain('https://github.com/login/oauth/authorize');
      expect(result.redirectUrl).toContain('state=http%253A%252F%252Flocalhost%253A3000%252F');
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
      expect(result.redirectUrl).toContain('https://github.com/login/oauth/authorize');
      expect(result.redirectUrl).toContain('state=http%253A%252F%252Fundefined%252F');
    });
  });

  describe('handleAuthCallback', () => {
    it('should successfully handle GitHub OAuth callback with provided state', async () => {
      // Arrange
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
      
      const code = 'mock-auth-code';
      const state = 'https%3A%2F%2Fapp.example.com%2Fdashboard';

      // Act
      const result = await authService.handleAuthCallback(code, state);

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
      
      // Verify GitHub API calls
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://github.com/login/oauth/access_token',
        {
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
          code: 'mock-auth-code',
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
            Authorization: 'Bearer mock-access-token',
          },
        }
      );
    });

    it('should use default origin URL when state is not provided', async () => {
      // Arrange
      const mockGitHubUser = {
        id: 456,
        login: 'anotheruser',
        name: 'Another User',
        email: 'another@example.com',
        avatar_url: 'https://github.com/avatar2.jpg'
      };
      
      mockedAxios.post.mockResolvedValueOnce({
        data: { access_token: 'mock-access-token-2' }
      });
      mockedAxios.get.mockResolvedValueOnce({
        data: mockGitHubUser
      });

      // Act
      const result = await authService.handleAuthCallback('mock-code');

      // Assert
      expect(result.sessionId).toBe('mock-uuid-123');
      expect(result.originUrl).toBe('/');
      expect(result.cookieOptions).toBeDefined();
    });

    it('should handle GitHub OAuth API errors', async () => {
      // Arrange
      mockedAxios.post.mockRejectedValueOnce(new Error('GitHub API error'));

      // Act & Assert
      await expect(authService.handleAuthCallback('invalid-code')).rejects.toThrow('Failed to authenticate with GitHub');
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
      expect(result.redirectUrl).toContain('https://github.com/login/oauth/authorize');
      expect(result.redirectUrl).toContain(
        'state=https%253A%252F%252Fapi.example.com%252Fapi%252Fusers'
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
      expect(result.redirectUrl).toContain('https://github.com/login/oauth/authorize');
      expect(result.redirectUrl).toContain(
        'state=http%253A%252F%252Flocalhost%253A8080%252Ftest'
      );
    });
  });
});
