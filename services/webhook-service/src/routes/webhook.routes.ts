import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateWebhookPayload } from '../middleware/validation.middleware';
import * as webhookController from '../controllers/webhook.controller';

// Create router
const webhookRouter = Router();

// Register routes
// Added validateWebhookPayload middleware between authMiddleware and the controller handler
webhookRouter.post(
  '/:webapp',
  authMiddleware,
  validateWebhookPayload,
  webhookController.handleWebhook,
);

export default webhookRouter;
