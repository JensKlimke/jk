import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import routes from '../../src/routes';
import axios from 'axios';

// Mock uuid for consistent testing
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'e2e-test-session-uuid'),
}));

// Mock axios for GitHub API calls
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Authentication Service E2E Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    // Create the complete application
    app = express();
    app.use(cookieParser());
    app.use('/', routes);
  });

  beforeEach(() => {
    // Reset axios mocks
    mockedAxios.post.mockReset();
    mockedAxios.get.mockReset();
  });

  describe('Health Check Endpoint', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
        ),
      });
      expect(response.headers['content-type']).toMatch(/json/);
    });
  });

  describe('Authentication Flow E2E', () => {
    describe('GET /auth - Authentication Check', () => {
      it('should redirect unauthenticated user to GitHub OAuth', async () => {
        const response = await request(app)
          .get('/auth')
          .set('X-Forwarded-Proto', 'https')
          .set('X-Forwarded-Host', 'app.example.com')
          .set('X-Original-URI', '/dashboard')
          .expect(302);

        const location = response.headers.location;
        expect(location).toContain('https://github.com/login/oauth/authorize');
        expect(location).toContain('client_id=test-client-id');
        expect(location).toContain('redirect_uri=http%3A%2F%2Fauth.localhost%2Fauth%2Fcallback');
        expect(location).toContain('state=https%253A%252F%252Fapp.example.com%252Fdashboard');
      });

      it('should authenticate user with valid auth cookie', async () => {
        // First, create a valid session through GitHub OAuth callback
        const mockGitHubUser = {
          id: 123,
          login: 'e2euser',
          name: 'E2E Test User',
          email: 'e2e@example.com',
          avatar_url: 'https://github.com/e2e-avatar.jpg'
        };
        
        mockedAxios.post.mockResolvedValueOnce({
          data: { access_token: 'e2e-access-token' }
        });
        mockedAxios.get.mockResolvedValueOnce({
          data: mockGitHubUser
        });
        
        // Create session through callback
        const callbackResponse = await request(app)
          .get('/auth/callback?code=github-auth-code&state=test-state')
          .expect(302);
        
        // Extract session cookie
        const setCookieHeader = callbackResponse.headers['set-cookie'][0];
        const sessionCookie = setCookieHeader.split(';')[0];
        
        // Now test authentication with the session cookie
        const response = await request(app)
          .get('/auth')
          .set('Cookie', sessionCookie)
          .expect(200);

        expect(response.text).toBe('Authenticated');
        expect(response.headers['x-user-id']).toBe('e2euser');
        expect(response.headers['x-user-role']).toBe('user');
      });

      it('should handle missing forwarded headers gracefully', async () => {
        const response = await request(app)
          .get('/auth')
          .set('host', 'localhost:3000')
          .expect(302);

        const location = response.headers.location;
        expect(location).toContain('https://github.com/login/oauth/authorize');
        expect(location).toContain('client_id=test-client-id');
        expect(location).toContain('state=http%253A%252F%252Flocalhost%253A3000%252F');
      });

      it('should handle complex URLs with query parameters', async () => {
        const response = await request(app)
          .get('/auth')
          .set('X-Forwarded-Proto', 'https')
          .set('X-Forwarded-Host', 'api.example.com')
          .set('X-Original-URI', '/api/users?filter=active&sort=name&page=1')
          .expect(302);

        const location = response.headers.location;
        expect(location).toContain('https://github.com/login/oauth/authorize');
        expect(location).toContain('client_id=test-client-id');
        expect(location).toContain('state=https%253A%252F%252Fapi.example.com%252Fapi%252Fusers%253Ffilter%253Dactive%2526sort%253Dname%2526page%253D1');
      });

      it('should handle URLs with fragments', async () => {
        const response = await request(app)
          .get('/auth')
          .set('X-Forwarded-Proto', 'https')
          .set('X-Forwarded-Host', 'app.example.com')
          .set('X-Original-URI', '/page#section1')
          .expect(302);

        const location = response.headers.location;
        expect(location).toContain('https://github.com/login/oauth/authorize');
        expect(location).toContain('client_id=test-client-id');
        expect(location).toContain('state=https%253A%252F%252Fapp.example.com%252Fpage%2523section1');
      });
    });

    describe('GET /auth/callback - Authentication Callback', () => {
      it('should set auth cookie and redirect to origin URL', async () => {
        // Mock GitHub API responses
        const mockGitHubUser = {
          id: 456,
          login: 'callbackuser',
          name: 'Callback User',
          email: 'callback@example.com',
          avatar_url: 'https://github.com/callback-avatar.jpg'
        };
        
        mockedAxios.post.mockResolvedValueOnce({
          data: { access_token: 'callback-access-token' }
        });
        mockedAxios.get.mockResolvedValueOnce({
          data: mockGitHubUser
        });
        
        const state = 'https%3A%2F%2Fapp.example.com%2Fdashboard';

        const response = await request(app)
          .get(`/auth/callback?code=github-auth-code&state=${state}`)
          .expect(302);

        expect(response.headers.location).toBe(
          'https://app.example.com/dashboard'
        );
        expect(response.headers['set-cookie']).toBeDefined();

        // Parse the set-cookie header
        const setCookieHeader = response.headers['set-cookie'][0];
        expect(setCookieHeader).toContain('auth=e2e-test-session-uuid');
        expect(setCookieHeader).toContain('HttpOnly');
        expect(setCookieHeader).toContain('Domain=.localhost');
        expect(setCookieHeader).toContain('SameSite=Lax');
        expect(setCookieHeader).toContain('Max-Age=86400');
      });

      it('should return 400 when code parameter is missing', async () => {
        const response = await request(app).get('/auth/callback').expect(400);

        expect(response.text).toBe('Authorization code not provided');
      });

      it('should redirect to root when no state provided', async () => {
        // Mock GitHub API responses
        const mockGitHubUser = {
          id: 789,
          login: 'nostateuser',
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

        const response = await request(app)
          .get('/auth/callback?code=github-auth-code')
          .expect(302);

        expect(response.headers.location).toBe('/');
        expect(response.headers['set-cookie']).toBeDefined();

        const setCookieHeader = response.headers['set-cookie'][0];
        expect(setCookieHeader).toContain('auth=e2e-test-session-uuid');
      });

      it('should handle complex encoded URLs', async () => {
        // Mock GitHub API responses
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
        
        const complexState =
          'https%3A%2F%2Fapi.example.com%2Fapi%2Fusers%3Ffilter%3Dactive%26sort%3Dname%23results';

        const response = await request(app)
          .get(`/auth/callback?code=github-auth-code&state=${complexState}`)
          .expect(302);

        expect(response.headers.location).toBe(
          'https://api.example.com/api/users?filter=active&sort=name#results'
        );
      });

      it('should handle empty state parameter', async () => {
        // Mock GitHub API responses
        const mockGitHubUser = {
          id: 131415,
          login: 'emptystateuser',
          name: 'Empty State User',
          email: 'emptystate@example.com',
          avatar_url: 'https://github.com/emptystate-avatar.jpg'
        };
        
        mockedAxios.post.mockResolvedValueOnce({
          data: { access_token: 'emptystate-access-token' }
        });
        mockedAxios.get.mockResolvedValueOnce({
          data: mockGitHubUser
        });
        
        const response = await request(app)
          .get('/auth/callback?code=github-auth-code&state=')
          .expect(302);

        expect(response.headers.location).toBe('/');
      });
    });

    describe('Complete Authentication Flow', () => {
      it('should complete full GitHub OAuth authentication cycle', async () => {
        // Step 1: Initial request without authentication
        const initialResponse = await request(app)
          .get('/auth')
          .set('X-Forwarded-Proto', 'https')
          .set('X-Forwarded-Host', 'app.example.com')
          .set('X-Original-URI', '/protected-page')
          .expect(302);

        // Verify GitHub OAuth redirect
        const redirectUrl = initialResponse.headers.location;
        expect(redirectUrl).toContain('https://github.com/login/oauth/authorize');
        expect(redirectUrl).toContain('client_id=test-client-id');
        expect(redirectUrl).toContain('state=https%253A%252F%252Fapp.example.com%252Fprotected-page');

        const stateMatch = redirectUrl.match(/state=([^&]+)/);
        const encodedState = stateMatch ? stateMatch[1] : '';

        // Step 2: Mock GitHub API and handle the callback
        const mockGitHubUser = {
          id: 999999,
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

        const callbackResponse = await request(app)
          .get(`/auth/callback?code=github-auth-code&state=${encodedState}`)
          .expect(302);

        expect(callbackResponse.headers.location).toBe(
          'https://app.example.com/protected-page'
        );

        // Extract the session cookie
        const setCookieHeader = callbackResponse.headers['set-cookie'][0];
        const cookieMatch = setCookieHeader.match(/auth=([^;]+)/);
        const sessionCookie = cookieMatch ? cookieMatch[1] : '';

        // Step 3: Make authenticated request with the session cookie
        const authenticatedResponse = await request(app)
          .get('/auth')
          .set('Cookie', `auth=${sessionCookie}`)
          .expect(200);

        expect(authenticatedResponse.text).toBe('Authenticated');
        expect(authenticatedResponse.headers['x-user-id']).toBe('fullcycleuser');
        expect(authenticatedResponse.headers['x-user-role']).toBe('user');
      });

      it('should maintain session across multiple requests', async () => {
        // Mock GitHub API responses
        const mockGitHubUser = {
          id: 888888,
          login: 'sessionuser',
          name: 'Session User',
          email: 'session@example.com',
          avatar_url: 'https://github.com/session-avatar.jpg'
        };
        
        mockedAxios.post.mockResolvedValueOnce({
          data: { access_token: 'session-access-token' }
        });
        mockedAxios.get.mockResolvedValueOnce({
          data: mockGitHubUser
        });
        
        // Get session cookie from callback
        const callbackResponse = await request(app)
          .get('/auth/callback?code=github-auth-code&state=https%3A%2F%2Fapp.example.com%2Fhome')
          .expect(302);

        const setCookieHeader = callbackResponse.headers['set-cookie'][0];
        const cookieMatch = setCookieHeader.match(/auth=([^;]+)/);
        const sessionCookie = cookieMatch ? cookieMatch[1] : '';

        // Make multiple authenticated requests
        for (let i = 0; i < 3; i++) {
          const response = await request(app)
            .get('/auth')
            .set('Cookie', `auth=${sessionCookie}`)
            .expect(200);

          expect(response.text).toBe('Authenticated');
          expect(response.headers['x-user-id']).toBe('sessionuser');
          expect(response.headers['x-user-role']).toBe('user');
        }
      });
    });

    describe('Error Scenarios', () => {
      it('should handle malformed cookies gracefully', async () => {
        const response = await request(app)
          .get('/auth')
          .set('Cookie', 'auth=; invalid-cookie')
          .set('X-Forwarded-Proto', 'https')
          .set('X-Forwarded-Host', 'app.example.com')
          .set('X-Original-URI', '/dashboard')
          .expect(302);

        // Should treat as unauthenticated and redirect to GitHub OAuth
        const location = response.headers.location;
        expect(location).toContain('https://github.com/login/oauth/authorize');
        expect(location).toContain('client_id=test-client-id');
        expect(location).toContain('state=https%253A%252F%252Fapp.example.com%252Fdashboard');
      });

      it('should handle missing headers in auth check', async () => {
        const response = await request(app).get('/auth').expect(302);

        // Should still work with default values and redirect to GitHub OAuth
        const location = response.headers.location;
        expect(location).toContain('https://github.com/login/oauth/authorize');
        expect(location).toContain('client_id=test-client-id');
      });

      it('should handle callback with missing code parameter', async () => {
        const response = await request(app)
          .get('/auth/callback?state=valid-state')
          .expect(400);

        expect(response.text).toBe('Authorization code not provided');
      });

      it('should handle GitHub API errors in callback', async () => {
        // Mock GitHub API to fail
        mockedAxios.post.mockRejectedValueOnce(new Error('GitHub API error'));

        const response = await request(app)
          .get('/auth/callback?code=invalid-code&state=valid-state')
          .expect(500);

        expect(response.text).toBe('GitHub authentication failed');
      });
    });

    describe('Security Headers and Cookies', () => {
      it('should set secure cookie attributes', async () => {
        // Mock GitHub API responses
        const mockGitHubUser = {
          id: 555,
          login: 'securityuser',
          name: 'Security User',
          email: 'security@example.com',
          avatar_url: 'https://github.com/security-avatar.jpg'
        };
        
        mockedAxios.post.mockResolvedValueOnce({
          data: { access_token: 'security-access-token' }
        });
        mockedAxios.get.mockResolvedValueOnce({
          data: mockGitHubUser
        });

        const response = await request(app)
          .get('/auth/callback?code=github-auth-code&state=https%3A%2F%2Fapp.example.com%2Fdashboard')
          .expect(302);

        const setCookieHeader = response.headers['set-cookie'][0];

        // Verify security attributes
        expect(setCookieHeader).toContain('HttpOnly');
        expect(setCookieHeader).toContain('SameSite=Lax');
        expect(setCookieHeader).toContain('Domain=.localhost');
        expect(setCookieHeader).toContain('Max-Age=86400'); // 24 hours

        // In test environment, secure should be false
        expect(setCookieHeader).not.toContain('Secure');
      });

      it('should set correct user headers for authenticated requests', async () => {
        // Mock GitHub API responses
        const mockGitHubUser = {
          id: 666,
          login: 'headeruser',
          name: 'Header User',
          email: 'header@example.com',
          avatar_url: 'https://github.com/header-avatar.jpg'
        };
        
        mockedAxios.post.mockResolvedValueOnce({
          data: { access_token: 'header-access-token' }
        });
        mockedAxios.get.mockResolvedValueOnce({
          data: mockGitHubUser
        });
        
        // Create session through callback
        const callbackResponse = await request(app)
          .get('/auth/callback?code=github-auth-code&state=test-state')
          .expect(302);
        
        // Extract session cookie
        const setCookieHeader = callbackResponse.headers['set-cookie'][0];
        const sessionCookie = setCookieHeader.split(';')[0];

        const response = await request(app)
          .get('/auth')
          .set('Cookie', sessionCookie)
          .expect(200);

        expect(response.headers['x-user-id']).toBe('headeruser');
        expect(response.headers['x-user-role']).toBe('user');

        // Verify no sensitive information is leaked
        expect(response.headers['x-session-id']).toBeUndefined();
        expect(response.headers['authorization']).toBeUndefined();
      });
    });

    describe('Edge Cases and Robustness', () => {
      it('should handle very long URLs', async () => {
        const longPath =
          '/very/long/path/' +
          'segment/'.repeat(50) +
          '?param=' +
          'value'.repeat(100);

        const response = await request(app)
          .get('/auth')
          .set('X-Forwarded-Proto', 'https')
          .set('X-Forwarded-Host', 'app.example.com')
          .set('X-Original-URI', longPath)
          .expect(302);

        const location = response.headers.location;
        expect(location).toContain('https://github.com/login/oauth/authorize');
        expect(location).toContain('client_id=test-client-id');
        expect(location).toContain('redirect_uri=http%3A%2F%2Fauth.localhost%2Fauth%2Fcallback');
        expect(location).toContain(
          encodeURIComponent(encodeURIComponent(`https://app.example.com${longPath}`))
        );
      });

      it('should handle special characters in URLs', async () => {
        const specialPath =
          '/path-with-dashes/special_chars?param=value&other=test123';

        const response = await request(app)
          .get('/auth')
          .set('X-Forwarded-Proto', 'https')
          .set('X-Forwarded-Host', 'app.example.com')
          .set('X-Original-URI', specialPath)
          .expect(302);

        const location = response.headers.location;
        expect(location).toContain('https://github.com/login/oauth/authorize');
        expect(location).toContain('client_id=test-client-id');
        expect(location).toContain('redirect_uri=http%3A%2F%2Fauth.localhost%2Fauth%2Fcallback');

        // Verify the callback can handle the encoded URL
        const stateMatch = location.match(/state=([^&]+)/);
        const state = stateMatch ? stateMatch[1] : '';

        // Mock GitHub API for callback test
        const mockGitHubUser = {
          id: 777,
          login: 'specialcharuser',
          name: 'Special Char User',
          email: 'specialchar@example.com',
          avatar_url: 'https://github.com/specialchar-avatar.jpg'
        };
        
        mockedAxios.post.mockResolvedValueOnce({
          data: { access_token: 'specialchar-access-token' }
        });
        mockedAxios.get.mockResolvedValueOnce({
          data: mockGitHubUser
        });

        const callbackResponse = await request(app)
          .get(`/auth/callback?code=github-auth-code&state=${state}`)
          .expect(302);

        expect(callbackResponse.headers.location).toContain(specialPath);
      });
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      await request(app).get('/unknown-endpoint').expect(404);
    });

    it('should return 404 for unknown methods on known endpoints', async () => {
      await request(app).post('/auth').expect(404);

      await request(app).put('/health').expect(404);
    });
  });
});
