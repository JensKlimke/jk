import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection URI and database name
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'finance';

// Middleware
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Finance API' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP' });
});

// Server instance
let server: any;

// Connect to MongoDB and start server
export const startServer = async (): Promise<void> => {
  try {
    await mongoose.connect(`${MONGO_URI}/${DB_NAME}`);
    console.log('Connected to MongoDB');

    server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

// Stop server and disconnect from MongoDB
export const stopServer = async (): Promise<void> => {
  if (server) {
    server.close();
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await stopServer();
  process.exit(0);
});

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;
