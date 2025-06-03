/**
 * Function to create and configure a service server with common setup
 */
import { Server } from 'http';
import { createApiServer } from './createApiServer';
import { Express, Router } from 'express';

/**
 * Options for creating a service server
 */
export interface ServiceServerOptions {
  /**
   * Port to listen on
   */
  port: number;
  
  /**
   * Base path for API routes
   */
  basePath: string;
  
  /**
   * Router to use for the service
   */
  router: Router;
  
  /**
   * Service name for logging
   */
  serviceName: string;
}

/**
 * Creates a service server with the specified options
 * @param options Options for creating the service server
 * @returns The Express app and a function to start the server
 */
export function createServiceServer(options: ServiceServerOptions): { 
  app: Express; 
  startServer: () => Server;
} {
  const { port, basePath, router, serviceName } = options;
  
  // Create API server
  const { app } = createApiServer({ port });
  
  // Register routes
  app.use(basePath, router);
  
  // Function to start the server with proper signal handling
  const startServer = (): Server => {
    // Only start the server if this file is run directly
    const server: Server = app.listen(port, () => {
      console.info(`${serviceName} server running at http://localhost:${port}`);
    });

    // Graceful shutdown function
    const gracefulShutdown = () => {
      console.info('SIGTERM/SIGINT received, shutting down gracefully');
      
      server.close(() => {
        console.info('Server closed');
        process.exit(0);
      });
      
      // Force close after timeout
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 5000);
    };

    // Handle signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    
    return server;
  };
  
  return { app, startServer };
}