/**
 * WHOIS API server entry point
 */
import { createApiServer } from '@jk/api-server';

import { whoisRouter } from './routes/whois';

// Create API server
const { app } = createApiServer();

// Register routes
app.use('/api/whois', whoisRouter);

// Only start the server if this file is run directly
if (require.main === module) {
  const port = process.env.PORT || 3002;
  app.listen(port, () => {
    console.info(`WHOIS API server running at http://localhost:${port}`);
  });
}

export default app;
