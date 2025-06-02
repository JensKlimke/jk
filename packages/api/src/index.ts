/**
 * Express API server entry point
 */
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { exampleRouter } from './routes/example';

// Create Express server
const app = express();
const port = process.env.PORT || 3001;

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Register routes
app.use('/api/examples', exampleRouter);

// Only start the server if this file is run directly
if (require.main === module) {
  app.listen(port, () => {
    console.info(`API server running at http://localhost:${port}`);
  });
}

export default app;
