import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import routes from '../../src/routes';

// Mock uuid for consistent testing
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'e2e-test-session-uuid'),
}));

describe('Authentication Service E2E Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    // Create the complete application
    app = express();
    app.use(cookieParser());
    app.use('/', routes);
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
      it('should redirect unauthenticated user to callback with state', async () => {
        const response = await request(app)
          .get('/auth')
          .set('X-Forwarded-Proto', 'https')
          .set('X-Forwarded-Host', 'app.example.com')
          .set('X-Original-URI', '/dashboard')
          .expect(302);

        expect(response.headers.location).toBe(
          'http://auth.localhost/auth/callback?state=https%3A%2F%2Fapp.example.com%2Fdashboard'
        );
      });

      it('should authenticate user with valid auth cookie', async () => {
        const response = await request(app)
          .get('/auth')
          .set('Cookie', 'auth=valid-session-id')
          .expect(200);

        expect(response.text).toBe('Authenticated');
        expect(response.headers['x-user-id']).toBe('user123');
        expect(response.headers['x-user-role']).toBe('admin');
      });

      it('should handle missing forwarded headers gracefully', async () => {
        const response = await request(app)
          .get('/auth')
          .set('host', 'localhost:3000')
          .expect(302);

        expect(response.headers.location).toBe(
          'http://auth.localhost/auth/callback?state=http%3A%2F%2Flocalhost%3A3000%2F'
        );
      });

      it('should handle complex URLs with query parameters', async () => {
        const response = await request(app)
          .get('/auth')
          .set('X-Forwarded-Proto', 'https')
          .set('X-Forwarded-Host', 'api.example.com')
          .set('X-Original-URI', '/api/users?filter=active&sort=name&page=1')
          .expect(302);

        expect(response.headers.location).toBe(
          'http://auth.localhost/auth/callback?state=https%3A%2F%2Fapi.example.com%2Fapi%2Fusers%3Ffilter%3Dactive%26sort%3Dname%26page%3D1'
        );
      });

      it('should handle URLs with fragments', async () => {
        const response = await request(app)
          .get('/auth')
          .set('X-Forwarded-Proto', 'https')
          .set('X-Forwarded-Host', 'app.example.com')
          .set('X-Original-URI', '/page#section1')
          .expect(302);

        expect(response.headers.location).toBe(
          'http://auth.localhost/auth/callback?state=https%3A%2F%2Fapp.example.com%2Fpage%23section1'
        );
      });
    });

    describe('GET /auth/callback - Authentication Callback', () => {
      it('should set auth cookie and redirect to origin URL', async () => {
        const state = 'https%3A%2F%2Fapp.example.com%2Fdashboard';

        const response = await request(app)
          .get(`/auth/callback?state=${state}`)
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

      it('should redirect to root when no state provided', async () => {
        const response = await request(app).get('/auth/callback').expect(302);

        expect(response.headers.location).toBe('/');
        expect(response.headers['set-cookie']).toBeDefined();

        const setCookieHeader = response.headers['set-cookie'][0];
        expect(setCookieHeader).toContain('auth=e2e-test-session-uuid');
      });

      it('should handle complex encoded URLs', async () => {
        const complexState =
          'https%3A%2F%2Fapi.example.com%2Fapi%2Fusers%3Ffilter%3Dactive%26sort%3Dname%23results';

        const response = await request(app)
          .get(`/auth/callback?state=${complexState}`)
          .expect(302);

        expect(response.headers.location).toBe(
          'https://api.example.com/api/users?filter=active&sort=name#results'
        );
      });

      it('should handle empty state parameter', async () => {
        const response = await request(app)
          .get('/auth/callback?state=')
          .expect(302);

        expect(response.headers.location).toBe('/');
      });
    });

    describe('Complete Authentication Flow', () => {
      it('should complete full authentication cycle', async () => {
        // Step 1: Initial request without authentication
        const initialResponse = await request(app)
          .get('/auth')
          .set('X-Forwarded-Proto', 'https')
          .set('X-Forwarded-Host', 'app.example.com')
          .set('X-Original-URI', '/protected-page')
          .expect(302);

        // Extract the redirect URL and state
        const redirectUrl = initialResponse.headers.location;
        expect(redirectUrl).toBe(
          'http://auth.localhost/auth/callback?state=https%3A%2F%2Fapp.example.com%2Fprotected-page'
        );

        const stateMatch = redirectUrl.match(/state=([^&]+)/);
        const state = stateMatch ? stateMatch[1] : '';

        // Step 2: Handle the callback (simulate user authentication)
        const callbackResponse = await request(app)
          .get(`/auth/callback?state=${state}`)
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
        expect(authenticatedResponse.headers['x-user-id']).toBe('user123');
        expect(authenticatedResponse.headers['x-user-role']).toBe('admin');
      });

      it('should maintain session across multiple requests', async () => {
        // Get session cookie from callback
        const callbackResponse = await request(app)
          .get('/auth/callback?state=https%3A%2F%2Fapp.example.com%2Fhome')
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
          expect(response.headers['x-user-id']).toBe('user123');
          expect(response.headers['x-user-role']).toBe('admin');
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

        // Should treat as unauthenticated and redirect
        expect(response.headers.location).toBe(
          'http://auth.localhost/auth/callback?state=https%3A%2F%2Fapp.example.com%2Fdashboard'
        );
      });

      it('should handle missing headers in auth check', async () => {
        const response = await request(app).get('/auth').expect(302);

        // Should still work with default values
        expect(response.headers.location).toContain(
          'http://auth.localhost/auth/callback?state='
        );
      });

      it('should handle callback with malformed state', async () => {
        const response = await request(app)
          .get('/auth/callback?state=malformed%state')
          .expect(500);

        // Malformed URL encoding causes decodeURIComponent to throw an error
        expect(response.text).toBe('Internal Server Error');
      });
    });

    describe('Security Headers and Cookies', () => {
      it('should set secure cookie attributes', async () => {
        const response = await request(app)
          .get('/auth/callback?state=https%3A%2F%2Fapp.example.com%2Fdashboard')
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
        const response = await request(app)
          .get('/auth')
          .set('Cookie', 'auth=valid-session')
          .expect(200);

        expect(response.headers['x-user-id']).toBe('user123');
        expect(response.headers['x-user-role']).toBe('admin');

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

        expect(response.headers.location).toContain(
          'http://auth.localhost/auth/callback?state='
        );
        expect(response.headers.location).toContain(
          encodeURIComponent(longPath)
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

        expect(response.headers.location).toContain(
          'http://auth.localhost/auth/callback?state='
        );

        // Verify the callback can handle the encoded URL
        const stateMatch = response.headers.location.match(/state=([^&]+)/);
        const state = stateMatch ? stateMatch[1] : '';

        const callbackResponse = await request(app)
          .get(`/auth/callback?state=${state}`)
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
