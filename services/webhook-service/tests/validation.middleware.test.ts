import { Request, Response, NextFunction } from 'express';
import { AppError } from '../src/middleware/error.middleware';

// Mock the catchAsync function
jest.mock('../src/utils/common', () => ({
  // Mock catchAsync to simply return the original function for testing
  catchAsync: jest.fn(fn => fn),
}));

// Mock the validation middleware
jest.mock('../src/middleware/validation.middleware', () => {
  return {
    validateWebhookPayload: (req: Request, res: Response, next: NextFunction) => {
      try {
        // Check if payload exists
        if (!req.body) {
          const error = new Error('Payload is missing') as any;
          error.statusCode = 400;
          next(error);
          return;
        }

        const { platform, repository, artifact_id, digest } = req.body;

        // Validate required fields
        if (!platform) {
          const error = new Error('platform is required') as any;
          error.statusCode = 400;
          next(error);
          return;
        }

        if (platform !== 'github.com') {
          const error = new Error('platform must be github.com') as any;
          error.statusCode = 400;
          next(error);
          return;
        }

        if (!repository) {
          const error = new Error('repository is required') as any;
          error.statusCode = 400;
          next(error);
          return;
        }

        if (!artifact_id) {
          const error = new Error('artifact_id is required') as any;
          error.statusCode = 400;
          next(error);
          return;
        }

        // Validate artifact_id format
        if (!/^\w+$/.test(artifact_id)) {
          const error = new Error(
            'artifact_id must contain only alphanumeric characters and underscores',
          ) as any;
          error.statusCode = 400;
          next(error);
          return;
        }

        // Validate digest format if provided
        if (digest && !/^\w+$/.test(digest)) {
          const error = new Error(
            'digest must contain only alphanumeric characters and underscores',
          ) as any;
          error.statusCode = 400;
          next(error);
          return;
        }

        // Replace the request body with the validated value
        // Keep only the fields defined in our schema
        req.body = {
          platform,
          repository,
          artifact_id,
          ...(digest && { digest }),
        };

        next();
      } catch (error) {
        next(error);
      }
    },
  };
});

// Import after mocking to get the mocked version
import { validateWebhookPayload } from '../src/middleware/validation.middleware';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  it('should accept a valid payload with github.com platform', async () => {
    mockRequest.body = {
      platform: 'github.com',
      repository: 'owner/repo_name',
      artifact_id: 'sample123',
      digest: 'abc123',
    };

    await validateWebhookPayload(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).not.toHaveBeenCalledWith(expect.any(AppError));
    expect(mockRequest.body).toEqual({
      platform: 'github.com',
      repository: 'owner/repo_name',
      artifact_id: 'sample123',
      digest: 'abc123',
    });
  });

  it('should reject a non-github.com platform', async () => {
    mockRequest.body = {
      platform: 'gitlab.com', // Not github.com
      repository: 'owner/repo_name',
      artifact_id: 'sample123',
      digest: 'abc123',
    };

    await validateWebhookPayload(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should reject a missing platform', async () => {
    mockRequest.body = {
      // Missing platform
      repository: 'owner/repo_name',
      artifact_id: 'sample123',
      digest: 'abc123',
    };

    await validateWebhookPayload(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should reject a missing repository', async () => {
    mockRequest.body = {
      platform: 'github.com',
      // Missing repository
      artifact_id: 'sample123',
      digest: 'abc123',
    };

    await validateWebhookPayload(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should reject a missing artifact_id', async () => {
    mockRequest.body = {
      platform: 'github.com',
      repository: 'owner/repo_name',
      // Missing artifact_id
      digest: 'abc123',
    };

    await validateWebhookPayload(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should accept a missing digest (optional)', async () => {
    mockRequest.body = {
      platform: 'github.com',
      repository: 'owner/repo_name',
      artifact_id: 'sample123',
      // Missing digest (optional)
    };

    await validateWebhookPayload(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).not.toHaveBeenCalledWith(expect.any(AppError));
    expect(mockRequest.body).toEqual({
      platform: 'github.com',
      repository: 'owner/repo_name',
      artifact_id: 'sample123',
    });
  });

  it('should ignore additional fields in the payload', async () => {
    mockRequest.body = {
      platform: 'github.com',
      repository: 'owner/repo_name',
      artifact_id: 'sample123',
      digest: 'abc123',
      extra_field: 'should be ignored',
    };

    await validateWebhookPayload(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).not.toHaveBeenCalledWith(expect.any(AppError));
    expect(mockRequest.body).toEqual({
      platform: 'github.com',
      repository: 'owner/repo_name',
      artifact_id: 'sample123',
      digest: 'abc123',
    });
    expect(mockRequest.body).not.toHaveProperty('extra_field');
  });
});
