import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import logger from '../utils/logger';

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

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

export interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

export class AuthService {
  private readonly githubClientId: string;
  private readonly githubClientSecret: string;
  private readonly sessions: Map<string, GitHubUser> = new Map();

  constructor() {
    this.githubClientId = process.env.GITHUB_CLIENT_ID || '';
    this.githubClientSecret = process.env.GITHUB_CLIENT_SECRET || '';
    
    if (!this.githubClientId || !this.githubClientSecret) {
      throw new Error('GitHub OAuth credentials not configured');
    }
  }

  /**
   * Check if user is authenticated based on auth cookie
   */
  checkAuthentication(req: Request): AuthResult {
    const authCookie = req.cookies['auth'];

    if (authCookie && this.sessions.has(authCookie)) {
      const user = this.sessions.get(authCookie)!;
      return {
        isAuthenticated: true,
        userId: user.login,
        userRole: 'user',
      };
    }

    // User is not authenticated, prepare redirect URL for GitHub OAuth
    const originUrl = this.buildOriginUrl(req);
    const state = encodeURIComponent(originUrl);
    const redirectUrl = this.getGitHubAuthUrl(state);

    return {
      isAuthenticated: false,
      redirectUrl,
    };
  }

  /**
   * Generate GitHub OAuth authorization URL
   */
  getGitHubAuthUrl(state: string): string {
    const domain = process.env.DOMAIN || 'localhost';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const redirectUri = `${protocol}://auth.${domain}/auth/callback`;
    
    const params = new URLSearchParams({
      client_id: this.githubClientId,
      redirect_uri: redirectUri,
      scope: 'user:email',
      state: state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<string> {
    const response = await axios.post<GitHubTokenResponse>(
      'https://github.com/login/oauth/access_token',
      {
        client_id: this.githubClientId,
        client_secret: this.githubClientSecret,
        code: code,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    return response.data.access_token;
  }

  /**
   * Fetch user information from GitHub
   */
  async fetchGitHubUser(accessToken: string): Promise<GitHubUser> {
    const response = await axios.get<GitHubUser>('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }

  /**
   * Handle authentication callback and generate session
   */
  async handleAuthCallback(code: string, state?: string): Promise<{
    sessionId: string;
    originUrl: string;
    cookieOptions: CookieOptions;
  }> {
    try {
      // Exchange code for access token
      const accessToken = await this.exchangeCodeForToken(code);
      
      // Fetch user information
      const user = await this.fetchGitHubUser(accessToken);
      
      // Generate session
      const sessionId = uuidv4();
      this.sessions.set(sessionId, user);
      
      const originUrl = state ? decodeURIComponent(state) : '/';
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
    } catch (error) {
      logger.error('Error in GitHub OAuth callback:', error);
      throw new Error('Failed to authenticate with GitHub');
    }
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
