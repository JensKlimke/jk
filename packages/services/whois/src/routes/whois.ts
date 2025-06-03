/**
 * WHOIS routes for the API
 */
import { randomUUID } from 'crypto';

import { Router } from 'express';

// Create router
export const whoisRouter = Router();

/**
 * GET /api/whois
 * Returns a unique identifier string
 */
whoisRouter.get('/', (req, res) => {
  // Generate a unique string
  const uniqueId = randomUUID();

  res.json({
    id: uniqueId,
    timestamp: new Date(),
    message: `Your unique identifier is: ${uniqueId}`,
  });
});

/**
 * GET /api/whois/:id
 * Returns information about the provided ID
 */
whoisRouter.get('/:id', (req, res) => {
  const { id } = req.params;

  res.json({
    id,
    timestamp: new Date(),
    message: `You requested information about ID: ${id}`,
  });
});
