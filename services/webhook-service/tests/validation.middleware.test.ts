import { Request, Response, NextFunction } from 'express';
import { validateWebhookPayload } from '../src/middleware/validation.middleware';
import { AppError } from '../src/middleware/error.middleware';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {}
    };
    mockResponse = {
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  it('should accept a valid payload with github.com platform', () => {
    mockRequest.body = {
      platform: 'github.com',
      repository: 'owner/repo_name',
      artifact_id: 'sample123',
      digest: 'abc123'
    };

    validateWebhookPayload(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).not.toHaveBeenCalledWith(expect.any(AppError));
    expect(mockRequest.body).toEqual({
      platform: 'github.com',
      repository: 'owner/repo_name',
      artifact_id: 'sample123',
      digest: 'abc123'
    });
  });

  it('should reject a non-github.com platform', () => {
    mockRequest.body = {
      platform: 'gitlab.com', // Not github.com
      repository: 'owner/repo_name',
      artifact_id: 'sample123',
      digest: 'abc123'
    };

    validateWebhookPayload(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
  });
  
  it('should reject a missing platform', () => {
    mockRequest.body = {
      // Missing platform
      repository: 'owner/repo_name',
      artifact_id: 'sample123',
      digest: 'abc123'
    };

    validateWebhookPayload(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
  });
  
  it('should reject a missing repository', () => {
    mockRequest.body = {
      platform: 'github.com',
      // Missing repository
      artifact_id: 'sample123',
      digest: 'abc123'
    };

    validateWebhookPayload(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
  });
  
  it('should reject a missing artifact_id', () => {
    mockRequest.body = {
      platform: 'github.com',
      repository: 'owner/repo_name',
      // Missing artifact_id
      digest: 'abc123'
    };

    validateWebhookPayload(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
  });
  
  it('should accept a missing digest (optional)', () => {
    mockRequest.body = {
      platform: 'github.com',
      repository: 'owner/repo_name',
      artifact_id: 'sample123'
      // Missing digest (optional)
    };

    validateWebhookPayload(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).not.toHaveBeenCalledWith(expect.any(AppError));
    expect(mockRequest.body).toEqual({
      platform: 'github.com',
      repository: 'owner/repo_name',
      artifact_id: 'sample123'
    });
  });

  it('should ignore additional fields in the payload', () => {
    mockRequest.body = {
      platform: 'github.com',
      repository: 'owner/repo_name',
      artifact_id: 'sample123',
      digest: 'abc123',
      extra_field: 'should be ignored'
    };

    validateWebhookPayload(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).not.toHaveBeenCalledWith(expect.any(AppError));
    expect(mockRequest.body).toEqual({
      platform: 'github.com',
      repository: 'owner/repo_name',
      artifact_id: 'sample123',
      digest: 'abc123'
    });
    expect(mockRequest.body).not.toHaveProperty('extra_field');
  });
});