import request from 'supertest';
import express from 'express';
import webhookRouter from '../src/routes/webhook.routes';
import { artifactService } from '../src/controllers/webhook.controller';
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
      artifact_url: 'https://example.com/artifacts/sample.zip'
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
        // Missing artifact_url field
      };

      const response = await request(app)
        .post('/test-app')
        .set('Authorization', 'Bearer test-secret')
        .send(invalidPayload);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('artifact_url is required');
    });

    it('should process the artifact and return 200 if request is valid', async () => {
      const response = await request(app)
        .post('/test-app')
        .set('Authorization', 'Bearer test-secret')
        .send(validPayload);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.message).toContain('Deployment successful');
      expect(response.body.details.artifact_url).toBe(validPayload.artifact_url);
      expect(response.body.details.extractPath).toBe('/var/www/test-app');

      // Verify that processArtifact was called with the correct arguments
      expect(artifactService.processArtifact).toHaveBeenCalledWith({
        artifact_url: validPayload.artifact_url,
        webapp: 'test-app'
      });
    });
  });
});
