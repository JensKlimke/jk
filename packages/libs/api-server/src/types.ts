/**
 * Type definitions for the API server library
 */

import { Express } from 'express';

/**
 * Configuration options for creating an API server
 */
export interface ApiServerOptions {
  /**
   * Port to listen on
   * @default 3001
   */
  port?: number;

  /**
   * Whether to enable CORS
   * @default true
   */
  enableCors?: boolean;

  /**
   * Whether to enable security headers with Helmet
   * @default true
   */
  enableHelmet?: boolean;

  /**
   * Whether to enable JSON body parsing
   * @default true
   */
  enableJsonBodyParser?: boolean;
}

/**
 * API server instance
 */
export interface ApiServer {
  /**
   * The Express app instance
   */
  app: Express;

  /**
   * Start the server
   * @returns A promise that resolves when the server is started
   */
  start: () => Promise<void>;
}
