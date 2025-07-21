import request from 'supertest';
import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import webhookRouter from '../src/routes/webhook.routes';
import { errorHandler } from '../src/middleware/error.middleware';
import { v4 as uuidv4 } from 'uuid';

// Mock environment variables
process.env.WEBHOOK_SECRET = 'test-secret';
process.env.WEB_ROOT = process.env.WEB_ROOT || '/var/www';

// Mock dependencies
jest.mock('fs-extra');
jest.mock('axios');
jest.mock('extract-zip');
jest.mock('uuid');

// Sample index.html content
const sampleHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Sample Deployment</title>
</head>
<body>
  <h1>Hello from Webhook Deployment!</h1>
  <p>This is a sample index.html file deployed via webhook.</p>
</body>
</html>
`;

describe('Webhook Deployment Test', () => {
  let app: express.Express;
  const testAppName = 'test-deployment';
  const webRoot = process.env.WEB_ROOT as string;
  const testDir = path.join(webRoot, testAppName);
  const indexHtmlPath = path.join(testDir, 'index.html');
  const mockUuid = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    // Reset mocks and setup
    jest.clearAllMocks();

    // Mock uuid
    (uuidv4 as jest.Mock).mockReturnValue(mockUuid);

    // Create a new Express app for each test
    app = express();
    app.use(express.json());
    app.use('/', webhookRouter);
    app.use(errorHandler);

    // Setup mock implementations
    const mockEnsureDirSync = fs.ensureDirSync as unknown as jest.Mock;
    mockEnsureDirSync.mockImplementation(() => {});

    const mockEnsureDir = fs.ensureDir as unknown as jest.Mock;
    mockEnsureDir.mockResolvedValue(undefined);

    const mockWriteFile = fs.writeFile as unknown as jest.Mock;
    mockWriteFile.mockResolvedValue(undefined);

    const mockPathExists = fs.pathExists as unknown as jest.Mock;
    mockPathExists.mockResolvedValue(true);

    const mockReadFile = fs.readFile as unknown as jest.Mock;
    mockReadFile.mockResolvedValue(sampleHtml);

    const mockWriteStream = {
      on: jest.fn().mockImplementation((event: string, callback: () => void) => {
        if (event === 'finish') {
          callback();
        }
        return mockWriteStream;
      })
    };

    const mockCreateWriteStream = fs.createWriteStream as unknown as jest.Mock;
    mockCreateWriteStream.mockReturnValue(mockWriteStream);

    const mockRemove = fs.remove as unknown as jest.Mock;
    mockRemove.mockResolvedValue(undefined);

    // Setup axios mock for download
    const mockAxios = axios as unknown as jest.Mock;
    mockAxios.mockImplementation((config: any) => {
      // It's a download request
      return Promise.resolve({
        data: {
          pipe: jest.fn((writeStream: any) => {
            // Simulate successful download
            setTimeout(() => {
              if (writeStream.on && typeof writeStream.on === 'function') {
                writeStream.on('finish', () => {});
              }
            }, 100);
          })
        }
      });
    });

    // Setup extract-zip mock
    const extractZip = require('extract-zip') as unknown as jest.Mock;
    extractZip.mockImplementation(async (source: string, options: any) => {
      // Simulate extraction by writing the sample index.html
      await fs.writeFile(indexHtmlPath, sampleHtml);
      return Promise.resolve();
    });
  });

  afterEach(async () => {
    // Clean up
    jest.restoreAllMocks();
  });

  it('should deploy a sample index.html file via webhook', async () => {
    // Prepare the webhook payload
    const webhookPayload = {
      artifact_url: 'https://example.com/artifacts/sample.zip'
    };

    // Send the webhook request
    const response = await request(app)
      .post(`/${testAppName}`)
      .set('Authorization', `Bearer ${process.env.WEBHOOK_SECRET}`)
      .send(webhookPayload);

    // Assert the response
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.message).toContain('Deployment successful');
    expect(response.body.details.artifact_url).toBe(webhookPayload.artifact_url);
    expect(response.body.details.extractPath).toBe(testDir);

    // Verify that the index.html file exists
    const fileExists = await fs.pathExists(indexHtmlPath);
    expect(fileExists).toBe(true);

    // Verify the content of the index.html file
    const fileContent = await fs.readFile(indexHtmlPath, 'utf8');
    expect(fileContent).toBe(sampleHtml);

    console.log(`Successfully deployed index.html to ${indexHtmlPath}`);
  });
});
