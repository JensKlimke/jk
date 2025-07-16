import express, { Router } from 'express';
import { WhoamiController } from '../controllers/whoami.controller';
import logger from '../utils/logger';

export function createRootRouter(whoamiController: WhoamiController): Router {
  const router = express.Router();

  logger.info('Setting up root router');

  // Route requests to the controller
  router.get('/', whoamiController.getWhoamiInfo);

  return router;
}
