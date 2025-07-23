import express from 'express';
import { DatabaseService } from './services/database.service';
import { FileStorageService } from './services/file-storage.service';
import { StorageService } from './services/storage.interface';
import { WhoamiService } from './services/whoami.service';
import { TemplateService } from './services/template.service';
import { WhoamiController } from './controllers/whoami.controller';
import { createRootRouter } from './routes/root.route';
import logger from './utils/logger';

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Determine which storage service to use
const useFileStorage = !process.env.MONGO_WEB_PASSWORD;
let storageService: StorageService;

if (useFileStorage) {
  logger.info('MongoDB password not set, using file-based storage');
  storageService = new FileStorageService();
} else {
  logger.info('Using MongoDB for storage');
  storageService = new DatabaseService();
}

// Create other services
const whoamiService = new WhoamiService();
const templateService = new TemplateService();

// Initialize app
async function initializeApp() {
  try {
    // Connect to storage with retry
    await storageService.connectWithRetry();

    // Get or create app ID
    const apiId = await storageService.getOrCreateApiId();

    // Create controller
    const whoamiController = new WhoamiController(whoamiService, templateService, apiId);

    // Set up routes
    app.use('/', createRootRouter(whoamiController));

    // Start server
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });

    // Handle shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down...');
      await storageService.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down...');
      await storageService.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to initialize app:', error);
    process.exit(1);
  }
}

// Start the app
initializeApp();
