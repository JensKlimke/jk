import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../../src/routes/auth.routes';
import healthRoutes from '../../src/routes/health.routes';

describe('Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    // Create Express app with middleware
    app = express();
    app.use(cookieParser());
  });

  describe('Auth Routes', () => {
    beforeEach(() => {
      app.use('/', authRoutes);
    });

    describe('GET /auth', () => {
      it('should respond to /auth endpoint', async () => {
        // Act - The actual controller will handle the request
        const response = await request(app).get('/auth');

        // Assert - Should get some response (either 200 or 302 depending on auth state)
        expect([200, 302]).toContain(response.status);
      });

      it('should handle cookies in request', async () => {
        // Act
        const response = await request(app)
          .get('/auth')
          .set('Cookie', 'auth=test-session');

        // Assert - Should handle the request without errors
        expect([200, 302]).toContain(response.status);
      });
    });

    describe('GET /auth/callback', () => {
      it('should respond to /auth/callback endpoint', async () => {
        // Act
        const response = await request(app).get('/auth/callback');

        // Assert - Should redirect (302) or handle the callback
        expect([200, 302]).toContain(response.status);
      });

      it('should handle query parameters', async () => {
        // Act
        const response = await request(app).get(
          '/auth/callback?state=test-state'
        );

        // Assert - Should handle the request without errors
        expect([200, 302]).toContain(response.status);
      });
    });
  });

  describe('Health Routes', () => {
    beforeEach(() => {
      app.use('/', healthRoutes);
    });

    describe('GET /health', () => {
      it('should return health status', async () => {
        // Act
        const response = await request(app).get('/health');

        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'healthy');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.headers['content-type']).toMatch(/json/);
      });

      it('should return valid timestamp', async () => {
        // Act
        const response = await request(app).get('/health');

        // Assert
        const timestamp = new Date(response.body.timestamp);
        expect(timestamp).toBeInstanceOf(Date);
        expect(timestamp.getTime()).not.toBeNaN();
      });

      it('should return ISO timestamp format', async () => {
        // Act
        const response = await request(app).get('/health');

        // Assert
        expect(response.body.timestamp).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
        );
      });
    });
  });

  describe('Route Integration', () => {
    beforeEach(() => {
      // Mount both route sets
      app.use('/', authRoutes);
      app.use('/', healthRoutes);
    });

    it('should handle all routes together', async () => {
      // Act & Assert - Test auth route
      const authResponse = await request(app).get('/auth');
      expect([200, 302]).toContain(authResponse.status);

      // Act & Assert - Test callback route
      const callbackResponse = await request(app).get('/auth/callback');
      expect([200, 302]).toContain(callbackResponse.status);

      // Act & Assert - Test health route
      const healthResponse = await request(app).get('/health');
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body.status).toBe('healthy');
    });

    it('should return 404 for unknown routes', async () => {
      // Act
      const response = await request(app).get('/unknown');

      // Assert
      expect(response.status).toBe(404);
    });
  });
});
