const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const redis = require('redis');
const rateLimit = require('express-rate-limit');

// Initialize express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Database connection
const pgPool = new Pool({
  host: process.env.POSTGRES_HOST || 'postgres',
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});

// Redis connection
let redisClient = null;
const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST || 'redis'}:6379`,
    });

    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });

    await redisClient.connect();
    console.log('Connected to Redis');
  } catch (error) {
    console.error('Redis connection error:', error);
  }
};

// Connect to Redis
connectRedis();

// Token authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  // Check if token matches the API token
  if (token === process.env.API_TOKEN) {
    req.user = { name: 'api', role: 'service' };
    return next();
  }

  // Otherwise, verify as JWT
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  });
};

// Health check endpoint (public)
app.get('/health', async (req, res) => {
  let dbStatus = false;
  let redisStatus = false;

  // Check database connection
  try {
    const dbResult = await pgPool.query('SELECT 1');
    dbStatus = dbResult.rows.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  // Check Redis connection
  try {
    if (redisClient && redisClient.isReady) {
      await redisClient.ping();
      redisStatus = true;
    }
  } catch (error) {
    console.error('Redis health check failed:', error);
  }

  const healthy = dbStatus && redisStatus;

  res.status(healthy ? 200 : 500).json({
    status: healthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus ? 'connected' : 'disconnected',
      redis: redisStatus ? 'connected' : 'disconnected'
    }
  });
});

// Protected API routes
app.get('/api/status', authenticateToken, (req, res) => {
  res.json({
    status: 'running',
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/data', authenticateToken, async (req, res) => {
  try {
    // Cache check
    const cacheKey = 'api:data';
    if (redisClient && redisClient.isReady) {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
    }

    // Database query
    const result = await pgPool.query('SELECT NOW() as time');
    const data = {
      time: result.rows[0].time,
      message: 'Data retrieved successfully',
      items: [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' }
      ]
    };

    // Cache result
    if (redisClient && redisClient.isReady) {
      await redisClient.set(cacheKey, JSON.stringify(data), {
        EX: 60 // Expire in 60 seconds
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// Start server
app.listen(port, () => {
  console.log(`API server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await pgPool.end();
  if (redisClient) await redisClient.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await pgPool.end();
  if (redisClient) await redisClient.quit();
  process.exit(0);
});
