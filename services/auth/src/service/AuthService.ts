import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface AuthResult {
  isAuthenticated: boolean;
  userId?: string;
  userRole?: string;
  redirectUrl?: string;
}

export interface CookieOptions {
  maxAge: number;
  secure: boolean;
  httpOnly: boolean;
  domain: string;
  sameSite: 'lax' | 'strict' | 'none';
}

export class AuthService {
  /**
   * Check if user is authenticated based on auth cookie
   */
  checkAuthentication(req: Request): AuthResult {
    const authCookie = req.cookies['auth'];

    if (authCookie) {
      // User is authenticated
      return {
        isAuthenticated: true,
        userId: 'user123', // Mock user ID
        userRole: 'admin', // Mock user role
      };
    }

    // User is not authenticated, prepare redirect URL
    const originUrl = this.buildOriginUrl(req);
    const state = encodeURIComponent(originUrl);
    const domain = process.env.DOMAIN || 'localhost';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const redirectUrl = `${protocol}://auth.${domain}/auth/callback?state=${state}`;

    return {
      isAuthenticated: false,
      redirectUrl,
    };
  }

  /**
   * Handle authentication callback and generate session
   */
  handleAuthCallback(state?: string): {
    sessionId: string;
    originUrl: string;
    cookieOptions: CookieOptions;
  } {
    const originUrl = state ? decodeURIComponent(state) : '/';
    const sessionId = uuidv4();
    const domain = process.env.DOMAIN || 'localhost';

    const cookieOptions: CookieOptions = {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      domain: `.${domain}`,
      sameSite: 'lax',
    };

    return {
      sessionId,
      originUrl,
      cookieOptions,
    };
  }

  /**
   * Build the origin URL from request headers
   */
  private buildOriginUrl(req: Request): string {
    const protocol = req.get('X-Forwarded-Proto') || 'http';
    const host = req.get('X-Forwarded-Host') || req.get('host');
    const uri = req.get('X-Original-URI') || '/';

    return `${protocol}://${host}${uri}`;
  }
}
