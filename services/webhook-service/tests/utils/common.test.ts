import { maskSecret } from '../../src/utils/common';

describe('Common Utilities', () => {
  describe('maskSecret', () => {
    it('should return "not set" for undefined secret', () => {
      expect(maskSecret(undefined)).toBe('not set');
    });

    it('should return "not set" for null secret', () => {
      // @ts-ignore - Testing null case even though type is string | undefined
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
});