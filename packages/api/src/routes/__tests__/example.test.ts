/**
 * Functional tests for the example routes
 *
 * These tests verify that the example API endpoints work as expected
 * by making HTTP requests and checking the responses.
 */
import { ExampleModel } from '@jk/models';
import request from 'supertest';

import app from '../../index';

describe('Example API Routes', () => {
  /**
   * Test case for GET /api/examples
   *
   * This test verifies that:
   * 1. The endpoint returns a 200 OK status
   * 2. The response is a JSON array
   * 3. The array contains example items with the expected structure
   */
  describe('GET /api/examples', () => {
    it('should return a list of examples', async () => {
      const response = await request(app)
        .get('/api/examples')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Verify the structure of the returned examples
      const example = response.body[0] as ExampleModel;
      expect(example).toHaveProperty('id');
      expect(example).toHaveProperty('name');
      expect(example).toHaveProperty('description');
      expect(example).toHaveProperty('createdAt');
    });
  });

  /**
   * Test case for GET /api/examples/:id
   *
   * This test verifies that:
   * 1. The endpoint returns a 200 OK status
   * 2. The response is a JSON object
   * 3. The object has the expected structure
   * 4. The object has the requested ID
   */
  describe('GET /api/examples/:id', () => {
    it('should return a single example by ID', async () => {
      const testId = '123';

      const response = await request(app)
        .get(`/api/examples/${testId}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // Verify the structure of the returned example
      const example = response.body as ExampleModel;
      expect(example).toHaveProperty('id', testId);
      expect(example).toHaveProperty('name');
      expect(example).toHaveProperty('description');
      expect(example).toHaveProperty('createdAt');
    });

    /**
     * Test for handling invalid IDs
     *
     * This test verifies that the API properly handles requests for non-existent resources
     * by checking that the response has the expected structure even for invalid IDs.
     */
    it('should handle invalid IDs gracefully', async () => {
      const invalidId = 'nonexistent';

      const response = await request(app)
        .get(`/api/examples/${invalidId}`)
        .expect('Content-Type', /json/)
        .expect(200); // Currently, the API returns 200 even for invalid IDs

      // Verify the structure of the returned example
      const example = response.body as ExampleModel;
      expect(example).toHaveProperty('id', invalidId);
      expect(example).toHaveProperty('name');
      expect(example).toHaveProperty('description');
      expect(example).toHaveProperty('createdAt');
    });
  });
});
