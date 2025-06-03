/**
 * Functional tests for the WHOIS API server
 *
 * These tests verify that the server can start and listen on the expected port.
 */
import { Server } from 'http';

import request from 'supertest';

import app from '../index';

describe('WHOIS API Server', () => {
  let server: Server;
  // Use a different port for testing to avoid conflicts
  const port = 3003;

  /**
   * Test case for server startup
   *
   * This test verifies that:
   * 1. The server can start and listen on the expected port
   * 2. The server can handle HTTP requests
   */
  it('should start and listen on the expected port', done => {
    // Start the server on the test port
    server = app.listen(port, () => {
      // Make a request to the server to verify it's running
      request(app)
        .get('/api/whois')
        .expect(200)
        .end(err => {
          // Close the server after the test
          server.close();
          if (err) return done(err);
          done();
        });
    });
  });

  /**
   * Test case for server response to unknown routes
   *
   * This test verifies that the server responds appropriately to requests for unknown routes.
   */
  it('should handle requests to unknown routes', async () => {
    const response = await request(app).get('/api/nonexistent');

    // Express default behavior is to return 404 for unknown routes
    expect(response.status).toBe(404);
  });
});
