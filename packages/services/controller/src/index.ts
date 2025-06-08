import { startServer } from './server';

// Get port from environment variable or use default
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Start the server
console.log('Starting Service Controller API Server...');
startServer(port).catch(error => {
  console.error('Error starting server:', error);
  process.exit(1);
});
