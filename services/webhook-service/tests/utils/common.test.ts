import { Request, Response } from 'express';
import { maskSecret, catchAsync } from '../../src/utils/common';

describe('Common Utilities', () => {
  describe('maskSecret', () => {
    it('should return "not set" for undefined secret', () => {
      expect(maskSecret(undefined)).toBe('not set');
    });

    it('should return "not set" for null secret', () => {
      // @ts-expect-error - Testing null case even though type is string | undefined
      expect(maskSecret(null)).toBe('not set');
    });

    it('should return "not set" for empty string', () => {
      expect(maskSecret('')).toBe('not set');
    });

    it('should return "********" for short secrets (8 characters or less)', () => {
      expect(maskSecret('1234')).toBe('********');
      expect(maskSecret('12345678')).toBe('********');
    });

    it('should mask the middle part of longer secrets', () => {
      // 9 characters: show first 2, last 2, mask 5 in the middle
      expect(maskSecret('123456789')).toBe('12*****89');

      // 12 characters: show first 2, last 2, mask 8 in the middle
      expect(maskSecret('123456789012')).toBe('12********12');

      // Test with a typical token
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const masked = maskSecret(token);

      // Should start with first 2 chars
      expect(masked.startsWith('ey')).toBe(true);

      // Should end with last 2 chars
      expect(masked.endsWith('J9')).toBe(true);

      // Middle should be all asterisks
      const middle = masked.substring(2, masked.length - 2);
      expect(middle).toBe('*'.repeat(token.length - 4));

      // Total length should match original
      expect(masked.length).toBe(token.length);
    });
  });

  describe('catchAsync', () => {
    // Mock request, response, and next function
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
      req = {};
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    it('should pass the result to the response when no error occurs', async () => {
      // Create a mock async function that resolves successfully
      const mockAsyncFn = jest.fn().mockResolvedValue('success');

      // Wrap it with catchAsync
      const wrappedFn = catchAsync(mockAsyncFn);

      // Call the wrapped function
      await wrappedFn(req as Request, res as Response, next);

      // Verify the original function was called with the correct arguments
      expect(mockAsyncFn).toHaveBeenCalledWith(req, res, next);

      // Verify next was not called with an error
      expect(next).not.toHaveBeenCalled();
    });

    it('should pass any error to the next function', async () => {
      // Create a mock error
      const testError = new Error('Test error');

      // Create a mock async function that rejects with an error
      const mockAsyncFn = jest.fn().mockRejectedValue(testError);

      // Wrap it with catchAsync
      const wrappedFn = catchAsync(mockAsyncFn);

      // Call the wrapped function
      await wrappedFn(req as Request, res as Response, next);

      // Verify the original function was called with the correct arguments
      expect(mockAsyncFn).toHaveBeenCalledWith(req, res, next);

      // Verify next was called with the error
      expect(next).toHaveBeenCalledWith(testError);
    });
  });
});
