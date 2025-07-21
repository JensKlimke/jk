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

  it('should accept a valid https URL', () => {
    mockRequest.body = {
      artifact_url: 'https://example.com/artifacts/sample.zip'
    };

    validateWebhookPayload(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).not.toHaveBeenCalledWith(expect.any(AppError));
    expect(mockRequest.body).toEqual({ artifact_url: 'https://example.com/artifacts/sample.zip' });
  });

  it('should accept a valid http URL', () => {
    mockRequest.body = {
      artifact_url: 'http://example.com/artifacts/sample.zip'
    };

    validateWebhookPayload(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).not.toHaveBeenCalledWith(expect.any(AppError));
    expect(mockRequest.body).toEqual({ artifact_url: 'http://example.com/artifacts/sample.zip' });
  });

  it('should reject an invalid URL', () => {
    mockRequest.body = {
      artifact_url: 'not-a-url'
    };

    validateWebhookPayload(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should reject a missing artifact_url', () => {
    mockRequest.body = {};

    validateWebhookPayload(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should ignore additional fields in the payload', () => {
    mockRequest.body = {
      artifact_url: 'https://example.com/artifacts/sample.zip',
      extra_field: 'should be ignored'
    };

    validateWebhookPayload(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).not.toHaveBeenCalledWith(expect.any(AppError));
    expect(mockRequest.body).toEqual({ artifact_url: 'https://example.com/artifacts/sample.zip' });
    expect(mockRequest.body).not.toHaveProperty('extra_field');
  });
});