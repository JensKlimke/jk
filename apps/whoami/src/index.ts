import express from 'express';
import { DatabaseService } from './services/database.service';
import { WhoamiService } from './services/whoami.service';
import { TemplateService } from './services/template.service';
import { createRootRouter } from './routes/root.route';
import logger from './utils/logger';

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Create services
const databaseService = new DatabaseService();
const whoamiService = new WhoamiService();
const templateService = new TemplateService();

// Initialize app
async function initializeApp() {
  try {
    // Connect to database with retry
    await databaseService.connectWithRetry();

    // Get or create app ID
    const apiId = await databaseService.getOrCreateApiId();

    // Set up routes
    app.use('/', createRootRouter(whoamiService, templateService, apiId));

    // Start server
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
    });

    // Handle shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down...');
      await databaseService.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down...');
      await databaseService.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to initialize app:', error);
    process.exit(1);
  }
}

// Start the app
initializeApp();
