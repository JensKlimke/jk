/**
 * Tests for the createApiServer function
 */
import request from 'supertest';

import { createApiServer } from '../createApiServer';

describe('createApiServer', () => {
  it('should create an API server with default options', () => {
    const apiServer = createApiServer();
    expect(apiServer).toBeDefined();
    expect(apiServer.app).toBeDefined();
    expect(apiServer.start).toBeDefined();
  });

  it('should create an API server with custom port', () => {
    const port = 4000;
    const apiServer = createApiServer({ port });
    expect(apiServer).toBeDefined();
  });

  it('should handle requests correctly', async () => {
    const apiServer = createApiServer();
    const { app } = apiServer;

    // Add a test route
    app.get('/test', (req, res) => {
      res.json({ message: 'Test successful' });
    });

    // Test the route
    const response = await request(app).get('/test').expect('Content-Type', /json/).expect(200);

    expect(response.body).toEqual({ message: 'Test successful' });
  });

  it('should disable middleware when specified', async () => {
    const apiServer = createApiServer({
      enableCors: false,
      enableHelmet: false,
      enableJsonBodyParser: false,
    });
    expect(apiServer).toBeDefined();
    expect(apiServer.app).toBeDefined();
  });
});
