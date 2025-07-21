import { Request, Response, NextFunction } from 'express';
import { ArtifactService } from '../services/artifact.service';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';

// Create artifact service
export const artifactService = new ArtifactService();

// Define webhook payload interface
interface WebhookPayload {
  artifact_url: string;
}

// Webhook endpoint handler
export const handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get webapp from URL parameter
    const webapp = req.params.webapp;

    if (!webapp) {
      throw new AppError('Webapp parameter is missing', 400);
    }

    logger.info(`Received webhook for webapp: ${webapp}`);

    // The payload is already validated by the validation middleware
    const payload = req.body as WebhookPayload;

    // Log webhook details
    logger.info('Processing webhook', {
      webapp,
      artifact_url: payload.artifact_url
    });

    // Create artifact info
    const artifactInfo = {
      artifact_url: payload.artifact_url,
      webapp
    };

    // Process the artifact
    const extractPath = await artifactService.processArtifact(artifactInfo);

    // Send success response
    res.status(200).json({
      status: 'success',
      message: `Deployment successful for ${webapp}`,
      details: {
        artifact_url: payload.artifact_url,
        extractPath
      }
    });
  } catch (error) {
    next(error);
  }
};
