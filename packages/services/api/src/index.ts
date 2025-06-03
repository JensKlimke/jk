/**
 * Express API server entry point
 */
import { createServiceServer } from '@jk/api-server';

import { exampleRouter } from './routes/example';

// Create service server with common configuration
const { app, startServer } = createServiceServer({
  port: Number(process.env.PORT || 3001),
  basePath: '/api/examples',
  router: exampleRouter,
  serviceName: 'API'
});

// Only start the server if this file is run directly
if (require.main === module) {
  // Start the server and store the reference
  // This ensures signal handlers are registered for graceful shutdown
  startServer();
}

export default app;
