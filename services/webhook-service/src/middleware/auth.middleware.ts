import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';
import { logger } from '../utils/logger';
import { maskSecret, catchAsync } from '../utils/common';

// Authentication middleware to verify Bearer token
export const authMiddleware = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get authorization header
    const authHeader = req.headers.authorization;

    // Check if authorization header exists
    if (!authHeader) {
      throw new AppError('Authorization header is missing', 401);
    }

    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      throw new AppError('Invalid authorization format. Expected Bearer token', 401);
    }

    // Extract the token
    const token = authHeader.split(' ')[1];

    // Check if token exists
    if (!token) {
      throw new AppError('Token is missing', 401);
    }

    // Get the expected token from environment variables
    const expectedToken = process.env.WEBHOOK_SECRET || null;

    // Check if expected token is configured
    if (!expectedToken) {
      logger.error('WEBHOOK_SECRET environment variable is not set');
      throw new AppError('Server authentication configuration error', 500);
    }

    // Verify the token
    if (token !== expectedToken) {
      logger.warn(
        `Invalid token provided. Received: ${maskSecret(token)}, Expected: ${maskSecret(expectedToken)}`,
      );
      throw new AppError('Invalid token', 401);
    }

    // If token is valid, proceed to the next middleware
    next();
  },
);
