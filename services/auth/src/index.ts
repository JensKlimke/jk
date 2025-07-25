import express from 'express';
import cookieParser from 'cookie-parser';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Add cookie parser middleware
app.use(cookieParser());

// Mount routes
app.use('/', routes);

app.listen(PORT, () => {
  console.log(`Cookie middleware server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
