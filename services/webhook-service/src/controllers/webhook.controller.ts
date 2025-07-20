import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { ArtifactService, ArtifactInfo } from '../services/artifact.service';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

// Create router
export const webhookRouter = Router();

// Create artifact service
export const artifactService = new ArtifactService();

// Define webhook payload interface
interface WebhookPayload {
  deployment_status: string;
  repository: string;
  commit: string;
  ref: string;
  event: string;
  artifact_url: string;
}

// Validate webhook payload
const validatePayload = (payload: any): WebhookPayload => {
  // Check if payload exists
  if (!payload) {
    throw new AppError('Payload is missing', 400);
  }

  // Check required fields
  const requiredFields = ['deployment_status', 'repository', 'commit', 'ref', 'event', 'artifact_url'];
  for (const field of requiredFields) {
    if (!payload[field]) {
      throw new AppError(`Missing required field: ${field}`, 400);
    }
  }

  // Check deployment status
  if (payload.deployment_status !== 'success') {
    throw new AppError(`Deployment status is not 'success': ${payload.deployment_status}`, 400);
  }

  return payload as WebhookPayload;
};

// Webhook endpoint handler
const handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get webapp from URL parameter
    const webapp = req.params.webapp;

    if (!webapp) {
      throw new AppError('Webapp parameter is missing', 400);
    }

    logger.info(`Received webhook for webapp: ${webapp}`);

    // Validate payload
    const payload = validatePayload(req.body);

    // Log webhook details
    logger.info('Processing webhook', {
      webapp,
      repository: payload.repository,
      commit: payload.commit,
      event: payload.event
    });

    // Create artifact info
    const artifactInfo: ArtifactInfo = {
      url: payload.artifact_url,
      repository: payload.repository,
      commit: payload.commit,
      webapp
    };

    // Process the artifact
    const extractPath = await artifactService.processArtifact(artifactInfo);

    // Send success response
    res.status(200).json({
      status: 'success',
      message: `Deployment successful for ${webapp}`,
      details: {
        repository: payload.repository,
        commit: payload.commit,
        extractPath
      }
    });
  } catch (error) {
    next(error);
  }
};

// Register routes
webhookRouter.post('/:webapp', authMiddleware, handleWebhook);
