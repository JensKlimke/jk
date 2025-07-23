import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Custom error class for application errors
export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Default status code and error message
  let statusCode = 500;
  let message = 'Internal Server Error';

  // If it's our custom error, use its status code and message
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Prepare log data
  const logData = {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  };

  // Choose log level based on status code
  if (statusCode >= 500) {
    // Server errors (5xx) - log as errors
    logger.error(`Server Error: ${message}`, logData);
  } else if (statusCode === 401 || statusCode === 403) {
    // Authentication/Authorization errors - log as info
    // These are very common and expected
    logger.info(`Auth Error: ${message}`, logData);
  } else if (statusCode >= 400) {
    // Other client errors (4xx) - log as warnings
    logger.warn(`Client Error: ${message}`, logData);
  } else {
    // Other status codes - log as info
    logger.info(`Info: ${message}`, logData);
  }

  // Send error response
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
