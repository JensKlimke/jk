import { Router } from 'express';
import authRoutes from './auth.routes';
import healthRoutes from './health.routes';

const router = Router();

// Mount auth routes
router.use('/', authRoutes);

// Mount health routes
router.use('/', healthRoutes);

export default router;
