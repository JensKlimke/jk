import path from 'path';

import cors from 'cors';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import logger from './utils/logger';

import { ConfigService } from './services/config';
import { DockerService } from './services/docker';
import { NginxService } from './services/nginx';
import { TemplateService } from './services/template';

// Initialize services
const configService = new ConfigService();
const dockerService = new DockerService();
const templateService = new TemplateService(configService);
const nginxService = new NginxService(dockerService);

// Create Express app
const app = express();

// Configure middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Load OpenAPI specification
try {
  const swaggerDocument = YAML.load(path.join(__dirname, '../openapi.yaml'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
  logger.warn('OpenAPI specification not found. API documentation will not be available.');
}

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// API endpoint to trigger template processing
app.post('/api/process-templates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if nginx-proxy container is running
    if (await dockerService.isContainerRunning('nginx-proxy')) {
      // Process templates
      await templateService.processTemplates();

      // Restart nginx
      await nginxService.restartNginx();

      res.status(200).json({ 
        status: 'success', 
        message: 'Templates processed and nginx restarted successfully' 
      });
    } else {
      res.status(503).json({ 
        status: 'error', 
        message: 'Nginx is not running' 
      });
    }
  } catch (error) {
    next(error);
  }
});

// API endpoint to get all containers with filtering capability
app.get('/api/containers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the environment filter from query parameters
    const envFilter = req.query.envFilter as string | undefined;

    // Get all containers with optional filtering
    const containers = await dockerService.getAllContainers(envFilter);

    res.status(200).json({
      status: 'success',
      count: containers.length,
      data: containers
    });
  } catch (error) {
    next(error);
  }
});

// API endpoint to get user information from oauth2-proxy
app.get('/api/user', (req: Request, res: Response) => {
  logger.debug('Headers received: ' + JSON.stringify(req.headers));
  // Extract user information from headers set by oauth2-proxy
  const user = {
    user: req.headers['x-user'] || null,
    email: req.headers['x-email'] || null,
    groups: req.headers['x-groups'] ? String(req.headers['x-groups']).split(','): [],
    accessToken: req.headers['x-access-token'] || null,
    requestedWith: req.headers['x-requested-with'] || null,
  };

  res.status(200).json({
    status: 'success',
    data: user
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Server error:', err);
  res.status(500).json({ 
    status: 'error', 
    message: err.message || 'An unexpected error occurred' 
  });
});

// Export the app for testing
export { app };

// Function to start the server
export async function startServer(port: number = 3000): Promise<void> {
  try {
    // Copy default configuration
    templateService.copyDefaultConfigs();

    // Wait for nginx to start
    logger.info('Waiting for nginx to be fully started...');
    await nginxService.waitForNginx();

    // Initial processing
    logger.info('Performing initial template processing...');
    await templateService.processTemplates();

    // Restart nginx
    await nginxService.restartNginx();

    // Start the server and store the server instance
    const server = app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
      logger.info(`API documentation available at http://localhost:${port}/api-docs`); // TODO: update to target url
    });

    // Setup graceful shutdown
    setupGracefulShutdown(server);
  } catch (error) {
    logger.error('Error starting server:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Setup graceful shutdown handlers
 * @param server The HTTP server instance
 */
function setupGracefulShutdown(server: ReturnType<typeof app.listen>): void {
  // Function to handle shutdown
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    // Close the server to stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed.');

      // Exit process
      logger.info('Graceful shutdown completed.');
      process.exit(0);
    });

    // Set a timeout for forceful shutdown if graceful shutdown takes too long
    setTimeout(() => {
      logger.error('Graceful shutdown timed out. Forcing exit.');
      process.exit(1);
    }, 10000); // 10 seconds timeout
  };

  // Listen for termination signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
