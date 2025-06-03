/**
 * WHOIS API server entry point
 */
import { createServiceServer } from '@jk/api-server';

import { whoisRouter } from './routes/whois';

// Create service server with common configuration
const { app, startServer } = createServiceServer({
  port: Number(process.env.PORT || 3002),
  basePath: '/api/whois',
  router: whoisRouter,
  serviceName: 'WHOIS',
});

// Only start the server if this file is run directly
if (require.main === module) {
  // Start the server and store the reference
  // This ensures signal handlers are registered for graceful shutdown
  startServer();
}

export default app;
