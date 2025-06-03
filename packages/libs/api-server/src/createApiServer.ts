/**
 * Function to create and configure an Express app with common middleware
 */
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { ApiServer, ApiServerOptions } from './types';

/**
 * Create an API server with the specified options
 * @param options Configuration options for the API server
 * @returns An API server instance
 */
export function createApiServer(options: ApiServerOptions = {}): ApiServer {
  // Set default options
  const {
    port = 3001,
    enableCors = true,
    enableHelmet = true,
    enableJsonBodyParser = true,
  } = options;

  // Create Express app
  const app = express();

  // Apply middleware
  if (enableHelmet) {
    app.use(helmet());
  }

  if (enableCors) {
    app.use(cors());
  }

  if (enableJsonBodyParser) {
    app.use(express.json());
  }

  // Create API server instance
  return {
    app,
    start: async () => {
      return new Promise<void>(resolve => {
        app.listen(port, () => {
          console.info(`API server running at http://localhost:${port}`);
          resolve();
        });
      });
    },
  };
}
