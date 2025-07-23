import { Request, Response, NextFunction } from 'express';
import { ArtifactService } from '../services/artifact.service';
import { AppError } from '../middleware/error.middleware';
import { logger } from '../utils/logger';
import { catchAsync } from '../utils/common';

// Create artifact service
export const artifactService = new ArtifactService();

// Define webhook payload interface
interface WebhookPayload {
  platform: string;
  repository: string;
  artifact_id: string;
  digest?: string;
}

// Webhook endpoint handler
export const handleWebhook = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
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
      platform: payload.platform,
      repository: payload.repository,
      artifact_id: payload.artifact_id,
    });

    // Create artifact info with optional digest
    const artifactInfo = {
      platform: payload.platform,
      repository: payload.repository,
      artifact_id: payload.artifact_id,
      webapp,
      ...(payload.digest && { digest: payload.digest }),
    };

    // Process the artifact
    const extractPath = await artifactService.processArtifact(artifactInfo);

    // Send success response
    res.status(200).json({
      status: 'success',
      message: `Deployment successful for ${webapp}`,
      details: {
        platform: payload.platform,
        repository: payload.repository,
        artifact_id: payload.artifact_id,
        digest: payload.digest,
        extractPath,
      },
    });
  },
);
