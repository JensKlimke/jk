import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './error.middleware';

// Webhook payload validation schema
const webhookSchema = Joi.object({
  platform: Joi.string()
    .valid('github.com')
    .required()
    .messages({
      'string.empty': 'platform cannot be empty',
      'any.required': 'platform is required',
      'any.only': 'platform must be github.com'
    }),
  repository: Joi.string()
    .required()
    .messages({
      'string.empty': 'repository cannot be empty',
      'any.required': 'repository is required'
    }),
  artifact_id: Joi.string()
    .pattern(/^\w+$/)
    .required()
    .messages({
      'string.pattern.base': 'artifact_id must contain only alphanumeric characters and underscores',
      'string.empty': 'artifact_id cannot be empty',
      'any.required': 'artifact_id is required'
    }),
  digest: Joi.string()
    .pattern(/^\w+$/)
    .optional()
    .messages({
      'string.pattern.base': 'digest must contain only alphanumeric characters and underscores'
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
    // Keep only the fields defined in our schema
    req.body = {
      platform: value.platform,
      repository: value.repository,
      artifact_id: value.artifact_id
    };
    
    // Add digest field if it exists
    if (value.digest) {
      req.body.digest = value.digest;
    }
    
    next();
  } catch (error) {
    next(error);
  }
};