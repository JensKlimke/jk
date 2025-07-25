import { Request, Response } from 'express';
import { AuthService } from '../service/AuthService';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Handle authentication check
   * GET /auth
   */
  checkAuth = (req: Request, res: Response): void => {
    try {
      const authResult = this.authService.checkAuthentication(req);

      if (authResult.isAuthenticated) {
        // Set the required headers for authenticated users
        res.set('X-User-Id', authResult.userId!);
        res.set('X-User-Role', authResult.userRole!);

        console.log('Authenticated user found in cookie');
        res.status(200).send('Authenticated');
      } else {
        // Redirect to auth callback with origin URL in state
        res.redirect(302, authResult.redirectUrl!);
      }
    } catch (error) {
      console.error('Error in checkAuth:', error);
      res.status(500).send('Internal Server Error');
    }
  };

  /**
   * Handle authentication callback
   * GET /auth/callback
   */
  handleCallback = (req: Request, res: Response): void => {
    try {
      const state = req.query.state as string;
      const callbackResult = this.authService.handleAuthCallback(state);

      // Set authentication cookie
      res.cookie(
        'auth',
        callbackResult.sessionId,
        callbackResult.cookieOptions
      );

      // Redirect back to the origin URL
      res.redirect(302, callbackResult.originUrl);
    } catch (error) {
      console.error('Error in handleCallback:', error);
      res.status(500).send('Internal Server Error');
    }
  };
}
