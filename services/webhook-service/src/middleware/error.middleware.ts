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
  next: NextFunction
) => {
  // Default status code and error message
  let statusCode = 500;
  let message = 'Internal Server Error';
  
  // If it's our custom error, use its status code and message
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  
  // Log the error
  logger.error(`Error: ${message}`, {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  
  // Send error response
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};