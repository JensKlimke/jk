import express from 'express';
import cookieParser from 'cookie-parser';
import routes from './routes';
import logger from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3000;

// Add cookie parser middleware with secret for signed cookies
app.use(cookieParser(process.env.COOKIE_SECRET));

// Mount routes
app.use('/', routes);

app.listen(PORT, () => {
  logger.info(`Cookie middleware server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
