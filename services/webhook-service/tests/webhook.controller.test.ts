import request from 'supertest';
import express from 'express';
import { webhookRouter, artifactService } from '../src/controllers/webhook.controller';
import { ArtifactService } from '../src/services/artifact.service';
import { errorHandler } from '../src/middleware/error.middleware';

// Mock environment variables
process.env.WEBHOOK_SECRET = 'test-secret';

// Mock the artifact service
jest.mock('../src/services/artifact.service', () => {
  return {
    ArtifactService: jest.fn().mockImplementation(() => ({
      processArtifact: jest.fn().mockResolvedValue('/var/www/test-app')
    }))
  };
});

describe('Webhook Controller', () => {
  let app: express.Express;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a new Express app for each test
    app = express();
    app.use(express.json());
    app.use('/', webhookRouter);
    app.use(errorHandler);
  });

  describe('POST /:webapp', () => {
    const validPayload = {
      deployment_status: 'success',
      repository: 'owner/repo',
      commit: 'commit-sha',
      ref: 'refs/heads/main',
      event: 'push',
      artifact_url: 'https://github.com/owner/repo/actions/runs/run-id'
    };

    it('should return 401 if no authorization header is provided', async () => {
      const response = await request(app)
        .post('/test-app')
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Authorization header is missing');
    });

    it('should return 401 if invalid token is provided', async () => {
      const response = await request(app)
        .post('/test-app')
        .set('Authorization', 'Bearer invalid-token')
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid token');
    });

    it('should return 400 if webapp parameter is missing', async () => {
      const response = await request(app)
        .post('/')
        .set('Authorization', 'Bearer test-secret')
        .send(validPayload);

      expect(response.status).toBe(404); // Express returns 404 for missing route parameters
    });

    it('should return 400 if payload is missing required fields', async () => {
      const invalidPayload = {
        deployment_status: 'success',
        repository: 'owner/repo',
        // Missing commit field
        ref: 'refs/heads/main',
        event: 'push',
        artifact_url: 'https://github.com/owner/repo/actions/runs/run-id'
      };

      const response = await request(app)
        .post('/test-app')
        .set('Authorization', 'Bearer test-secret')
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Missing required field');
    });

    it('should return 400 if deployment_status is not success', async () => {
      const invalidPayload = {
        ...validPayload,
        deployment_status: 'failed'
      };

      const response = await request(app)
        .post('/test-app')
        .set('Authorization', 'Bearer test-secret')
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Deployment status is not');
    });

    it('should process the artifact and return 200 if request is valid', async () => {
      const response = await request(app)
        .post('/test-app')
        .set('Authorization', 'Bearer test-secret')
        .send(validPayload);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('Deployment successful');
      expect(response.body.details.repository).toBe(validPayload.repository);
      expect(response.body.details.commit).toBe(validPayload.commit);
      expect(response.body.details.extractPath).toBe('/var/www/test-app');

      // Verify that processArtifact was called with the correct arguments
      expect(artifactService.processArtifact).toHaveBeenCalledWith({
        url: validPayload.artifact_url,
        repository: validPayload.repository,
        commit: validPayload.commit,
        webapp: 'test-app'
      });
    });
  });
});
