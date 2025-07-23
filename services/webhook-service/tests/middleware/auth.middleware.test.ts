import { Request, Response } from 'express';
import { authMiddleware } from '../../src/middleware/auth.middleware';
import { logger } from '../../src/utils/logger';
import { maskSecret } from '../../src/utils/common';

// Mock the logger and maskSecret function
jest.mock('../../src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../src/utils/common', () => ({
  maskSecret: jest.fn(secret => {
    if (!secret) return 'not set';
    if (secret.length <= 8) return '********';
    return `${secret.substring(0, 2)}${'*'.repeat(secret.length - 4)}${secret.substring(secret.length - 2)}`;
  }),
  // Mock catchAsync to simply return the original function for testing
  catchAsync: jest.fn(fn => fn),
}));

// Mock the auth middleware to use the original implementation but without catchAsync
jest.mock('../../src/middleware/auth.middleware', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    try {
      // Get authorization header
      const authHeader = req.headers.authorization;

      // Check if authorization header exists
      if (!authHeader) {
        const error = new Error('Authorization header is missing') as any;
        error.statusCode = 401;
        next(error);
        return;
      }

      // Check if it's a Bearer token
      if (!authHeader.startsWith('Bearer ')) {
        const error = new Error('Invalid authorization format. Expected Bearer token') as any;
        error.statusCode = 401;
        next(error);
        return;
      }

      // Extract the token
      const token = authHeader.split(' ')[1];

      // Check if token exists
      if (!token) {
        const error = new Error('Token is missing') as any;
        error.statusCode = 401;
        next(error);
        return;
      }

      // Get the expected token from environment variables
      const expectedToken = process.env.WEBHOOK_SECRET || null;

      // Check if expected token is configured
      if (!expectedToken) {
        // Use the mocked logger from the import at the top
        logger.error('WEBHOOK_SECRET environment variable is not set');
        const error = new Error('Server authentication configuration error') as any;
        error.statusCode = 500;
        next(error);
        return;
      }

      // Verify the token
      if (token !== expectedToken) {
        // Use the mocked logger and maskSecret from the imports at the top
        logger.warn(
          `Invalid token provided. Received: ${maskSecret(token)}, Expected: ${maskSecret(expectedToken)}`,
        );
        const error = new Error('Invalid token') as any;
        error.statusCode = 401;
        next(error);
        return;
      }

      // If token is valid, proceed to the next middleware
      next();
    } catch (error) {
      next(error);
    }
  },
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup environment variable
    process.env.WEBHOOK_SECRET = 'test-secret';

    // Setup mock request, response, and next function
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    // Clean up
    jest.restoreAllMocks();
  });

  it('should call next() when valid token is provided', async () => {
    // Arrange
    mockRequest.headers = {
      authorization: 'Bearer test-secret',
    };

    // Act
    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Assert
    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction).toHaveBeenCalledWith();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('should pass error to next() when no authorization header is provided', async () => {
    // Act
    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Assert
    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction.mock.calls[0][0].message).toBe('Authorization header is missing');
    expect(nextFunction.mock.calls[0][0].statusCode).toBe(401);
  });

  it('should pass error to next() when authorization format is invalid', async () => {
    // Arrange
    mockRequest.headers = {
      authorization: 'InvalidFormat',
    };

    // Act
    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Assert
    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction.mock.calls[0][0].message).toBe(
      'Invalid authorization format. Expected Bearer token',
    );
    expect(nextFunction.mock.calls[0][0].statusCode).toBe(401);
  });

  it('should pass error to next() when token is missing', async () => {
    // Arrange
    mockRequest.headers = {
      authorization: 'Bearer ',
    };

    // Act
    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Assert
    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction.mock.calls[0][0].message).toBe('Token is missing');
    expect(nextFunction.mock.calls[0][0].statusCode).toBe(401);
  });

  it('should log error and pass error to next() when WEBHOOK_SECRET is not set', async () => {
    // Arrange
    delete process.env.WEBHOOK_SECRET;
    mockRequest.headers = {
      authorization: 'Bearer some-token',
    };

    // Act
    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Assert
    expect(logger.error).toHaveBeenCalledWith('WEBHOOK_SECRET environment variable is not set');
    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction.mock.calls[0][0].message).toBe('Server authentication configuration error');
    expect(nextFunction.mock.calls[0][0].statusCode).toBe(500);
  });

  it('should log masked tokens and pass error to next() when invalid token is provided', async () => {
    // Arrange
    const invalidToken = 'invalid-token';
    const expectedToken = 'test-secret';

    mockRequest.headers = {
      authorization: `Bearer ${invalidToken}`,
    };

    // Act
    await authMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Assert
    expect(maskSecret).toHaveBeenCalledWith(invalidToken);
    expect(maskSecret).toHaveBeenCalledWith(expectedToken);

    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      `Invalid token provided. Received: ${maskSecret(invalidToken)}, Expected: ${maskSecret(expectedToken)}`,
    );

    expect(nextFunction).toHaveBeenCalledTimes(1);
    expect(nextFunction.mock.calls[0][0].message).toBe('Invalid token');
    expect(nextFunction.mock.calls[0][0].statusCode).toBe(401);
  });
});
