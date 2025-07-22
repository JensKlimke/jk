/**
 * Common utility functions for the webhook service
 */

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