import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const authController = new AuthController();

// Root route - checks for auth cookie, returns 200 if present, otherwise redirects to callback
router.get('/auth', authController.checkAuth);

// Auth callback route - sets headers, cookie and redirects to origin
router.get('/auth/callback', authController.handleCallback);

export default router;
