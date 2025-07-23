import os from 'os';
import logger from './logger';

/**
 * Gets the instance key for the application.
 * Uses INSTANCE_KEY environment variable if provided, otherwise uses hostname.
 * 
 * @param context Optional context information to include in the log message
 * @returns The instance key string
 */
export function getInstanceKey(context?: string): string {
  // Use INSTANCE_KEY environment variable if provided, otherwise use hostname
  const instanceKey = process.env.INSTANCE_KEY || os.hostname();
  
  // Log with context if provided
  if (context) {
    logger.info(`Using instance key for ${context}:`, { instanceKey });
  } else {
    logger.info('Using instance key:', { instanceKey });
  }
  
  return instanceKey;
}