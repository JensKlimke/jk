import express from 'express';
import cookieParser from 'cookie-parser';
import cookieService from './service/cookie.service';

const app = express();
const PORT = process.env.PORT || 3000;

// Enable cookie parsing
app.use(cookieParser());

// Apply the cookie middleware
app.use(cookieService({
  cookieName: 'user_session',
  cookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true
}));

// Basic routes for testing
app.get('/', (req, res) => {
  const sessionId = req.cookies.user_session;
  res.json({
    message: 'Hello World!',
    sessionId: sessionId ? `${sessionId.substring(0, 8)}...` : 'No session',
    timestamp: new Date().toISOString()
  });
});

app.get('/status', (req, res) => {
  const sessionId = req.cookies.user_session;
  res.json({
    status: 'OK',
    hasSession: !!sessionId,
    sessionPreview: sessionId ? `${sessionId.substring(0, 8)}...` : null,
    cookies: Object.keys(req.cookies)
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Cookie middleware server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});