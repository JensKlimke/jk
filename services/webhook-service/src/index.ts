import express from 'express';
import dotenv from 'dotenv';
import webhookRouter from './routes/webhook.routes';
import { errorHandler } from './middleware/error.middleware';
import { setupLogger, logger } from './utils/logger';

// Load environment variables
dotenv.config();

// Setup logger
setupLogger();

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/', webhookRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(port, () => {
  logger.info(`Webhook service listening on port ${port}`);
});

export default app;