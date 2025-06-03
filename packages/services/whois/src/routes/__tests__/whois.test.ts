/**
 * Functional tests for the WHOIS routes
 *
 * These tests verify that the WHOIS API endpoints work as expected
 * by making HTTP requests and checking the responses.
 */
import request from 'supertest';

import app from '../../index';

describe('WHOIS API Routes', () => {
  /**
   * Test case for GET /api/whois
   *
   * This test verifies that:
   * 1. The endpoint returns a 200 OK status
   * 2. The response is a JSON object
   * 3. The object contains the expected properties
   */
  describe('GET /api/whois', () => {
    it('should return a unique identifier', async () => {
      const response = await request(app)
        .get('/api/whois')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.id).toBe('string');
      expect(response.body.message).toContain(response.body.id);
    });
  });

  /**
   * Test case for GET /api/whois/:id
   *
   * This test verifies that:
   * 1. The endpoint returns a 200 OK status
   * 2. The response is a JSON object
   * 3. The object contains the expected properties
   * 4. The object has the requested ID
   */
  describe('GET /api/whois/:id', () => {
    it('should return information about the provided ID', async () => {
      const testId = '123';

      const response = await request(app)
        .get(`/api/whois/${testId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('id', testId);
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain(testId);
    });
  });
});
