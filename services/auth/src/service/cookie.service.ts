import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface CookieMiddlewareOptions {
  cookieName?: string;
  cookieMaxAge?: number;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
}

const cookieService = (options: CookieMiddlewareOptions = {}) => {
  const {
    cookieName = 'session_id',
    cookieMaxAge = 24 * 60 * 60 * 1000, // 24 hours
    domain,
    secure = process.env.NODE_ENV === 'production',
    httpOnly = true
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Check if cookie exists
    const existingCookie = req.cookies[cookieName];
    
    if (!existingCookie) {
      // Generate random ID
      const randomId = uuidv4();
      
      // Determine if request is over HTTPS
      const isHttps = req.secure || 
                     req.get('X-Forwarded-Proto') === 'https' ||
                     req.get('X-Forwarded-Ssl') === 'on';
      
      // Only set secure flag if actually using HTTPS
      const shouldBeSecure = secure && isHttps;
      
      // Set cookie with random ID
      res.cookie(cookieName, randomId, {
        maxAge: cookieMaxAge,
        domain,
        secure: shouldBeSecure,
        httpOnly,
        sameSite: 'lax'
      });
      
      // Optional: Log cookie creation for monitoring
      console.log(`Created new session cookie: ${randomId.substring(0, 8)}... (secure: ${shouldBeSecure}, https: ${isHttps})`);
    }
    
    // Continue to the originally called app
    next();
  };
};

export default cookieService;