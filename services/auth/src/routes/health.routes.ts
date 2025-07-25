import { Router, Request, Response } from 'express';

const router = Router();

// Health check route
router.get('/health', (_: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
