/**
 * Common utility functions for the webhook service
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Masks a secret string for safe logging
 * Shows first 2 and last 2 characters, masks the rest with asterisks
 *
 * @param secret - The secret string to mask
 * @returns The masked string
 */
export const maskSecret = (secret: string | undefined): string => {
  if (!secret) return 'not set';
  if (secret.length <= 8) return '********'; // For very short secrets, mask completely

  // Show first 2 and last 2 characters, mask the rest
  const firstChars = secret.substring(0, 2);
  const lastChars = secret.substring(secret.length - 2);
  const maskedLength = secret.length - 4;
  const maskedPart = '*'.repeat(maskedLength);

  return `${firstChars}${maskedPart}${lastChars}`;
};

/**
 * Wraps an async function and handles any errors by passing them to the next middleware.
 * This utility simplifies error handling in Express route handlers and middleware by
 * eliminating the need for repetitive try-catch blocks.
 *
 * The catchAsync function takes an async controller or middleware function and returns
 * a new function that automatically catches any errors that occur during the execution
 * of the wrapped function and passes them to Express's next() function.
 *
 * Example usage:
 * ```typescript
 * // Without catchAsync
 * export const handleRoute = async (req: Request, res: Response, next: NextFunction) => {
 *   try {
 *     // Do something async
 *     const data = await someAsyncOperation();
 *     res.json(data);
 *   } catch (error) {
 *     next(error);
 *   }
 * };
 *
 * // With catchAsync
 * export const handleRoute = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
 *   // Do something async
 *   const data = await someAsyncOperation();
 *   res.json(data);
 *   // No try-catch needed - errors are automatically caught and passed to next()
 * });
 * ```
 *
 * @param fn - The async function to wrap (typically a route handler or middleware)
 * @returns A function that wraps the original function and automatically handles errors
 */
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
