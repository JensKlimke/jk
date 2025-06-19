import { startServer } from './server';
import logger from './utils/logger';

// Get port from environment variable or use default
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Start the server
logger.info('Starting Service Controller API Server...');
startServer(port).catch(error => {
  logger.error('Error starting server:', error instanceof Error ? error : new Error(String(error)));
  process.exit(1);
});
