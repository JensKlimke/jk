import request from 'supertest';
import express from 'express';
import webhookRouter from '../src/routes/webhook.routes';
import { artifactService } from '../src/controllers/webhook.controller';
import { errorHandler } from '../src/middleware/error.middleware';

// Mock environment variables
process.env.WEBHOOK_SECRET = 'test-secret';

// Mock the artifact service
jest.mock('../src/services/artifact.service', () => {
  return {
    ArtifactService: jest.fn().mockImplementation(() => ({
      processArtifact: jest.fn().mockResolvedValue('/var/www/test-app'),
    })),
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
      platform: 'github.com',
      repository: 'owner/repo_name',
      artifact_id: 'sample123',
      digest: 'abc123',
    };

    it('should return 401 if no authorization header is provided', async () => {
      const response = await request(app).post('/test-app').send(validPayload);

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
        // Missing all required fields
      };

      const response = await request(app)
        .post('/test-app')
        .set('Authorization', 'Bearer test-secret')
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('required');
    });

    it('should return 400 if payload is missing platform field', async () => {
      const invalidPayload = {
        // Missing platform field
        repository: 'owner/repo_name',
        artifact_id: 'sample123',
      };

      const response = await request(app)
        .post('/test-app')
        .set('Authorization', 'Bearer test-secret')
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('platform is required');
    });

    it('should return 400 if payload is missing repository field', async () => {
      const invalidPayload = {
        platform: 'github.com',
        // Missing repository field
        artifact_id: 'sample123',
      };

      const response = await request(app)
        .post('/test-app')
        .set('Authorization', 'Bearer test-secret')
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('repository is required');
    });

    it('should return 400 if payload is missing artifact_id field', async () => {
      const invalidPayload = {
        platform: 'github.com',
        repository: 'owner/repo_name',
        // Missing artifact_id field
      };

      const response = await request(app)
        .post('/test-app')
        .set('Authorization', 'Bearer test-secret')
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('artifact_id is required');
    });

    it('should return 400 if platform is not github.com', async () => {
      const invalidPayload = {
        platform: 'gitlab.com', // Not github.com
        repository: 'owner/repo_name',
        artifact_id: 'sample123',
      };

      const response = await request(app)
        .post('/test-app')
        .set('Authorization', 'Bearer test-secret')
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('platform must be github.com');
    });

    it('should process the artifact and return 200 if request is valid', async () => {
      const response = await request(app)
        .post('/test-app')
        .set('Authorization', 'Bearer test-secret')
        .send(validPayload);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('Deployment successful');
      expect(response.body.details.platform).toBe(validPayload.platform);
      expect(response.body.details.repository).toBe(validPayload.repository);
      expect(response.body.details.artifact_id).toBe(validPayload.artifact_id);
      expect(response.body.details.digest).toBe(validPayload.digest);
      expect(response.body.details.extractPath).toBe('/var/www/test-app');

      // Verify that processArtifact was called with the correct arguments
      expect(artifactService.processArtifact).toHaveBeenCalledWith({
        platform: validPayload.platform,
        repository: validPayload.repository,
        artifact_id: validPayload.artifact_id,
        digest: validPayload.digest,
        webapp: 'test-app',
      });
    });
  });
});
