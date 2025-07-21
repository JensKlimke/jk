import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './error.middleware';

// Webhook payload validation schema
const webhookSchema = Joi.object({
  artifact_url: Joi.string()
    .uri({ scheme: ['https', 'http'] })
    .required()
    .messages({
      'string.uri': 'artifact_url must be a valid URL starting with http:// or https://',
      'string.empty': 'artifact_url cannot be empty',
      'any.required': 'artifact_url is required'
    })
}).unknown(true); // Allow unknown fields but they will be ignored

// Middleware to validate webhook payload
export const validateWebhookPayload = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check if payload exists
    if (!req.body) {
      throw new AppError('Payload is missing', 400);
    }

    // Validate payload against schema
    const { error, value } = webhookSchema.validate(req.body);
    
    if (error) {
      throw new AppError(error.message, 400);
    }

    // Replace the request body with the validated value
    // This effectively strips out any fields not in our schema
    req.body = {
      artifact_url: value.artifact_url
    };
    
    next();
  } catch (error) {
    next(error);
  }
};