# API Server Library

Generic API server library for the JK project. This library provides utilities for creating and managing API servers with common middleware and graceful shutdown support.

## Features

- Create Express API servers with common middleware
- Configurable CORS, Helmet, and JSON body parsing
- Simple API for starting the server
- Graceful shutdown support for proper handling of SIGTERM and SIGINT signals
- Clean resource management for containerized environments

## Installation

```bash
npm install @jk/api-server
```

## Usage

### Basic API Server

```typescript
import { createApiServer } from '@jk/api-server';

// Create an API server with default options
const apiServer = createApiServer();

// Register routes
apiServer.app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello, world!' });
});

// Start the server
apiServer.start().then(() => {
  console.log('Server started successfully');
});
```

### Service Server with Graceful Shutdown

For production services, especially in containerized environments, use the `createServiceServer` function which adds graceful shutdown support:

```typescript
import { createServiceServer } from '@jk/api-server';

// Create a service server with routes
const { app, startServer } = createServiceServer({
  port: 3001,
  routes: (app) => {
    app.get('/api/hello', (req, res) => {
      res.json({ message: 'Hello, world!' });
    });
  }
});

// Start the server with graceful shutdown support
startServer().then(() => {
  console.log('Service started successfully with graceful shutdown support');
});
```

The `createServiceServer` function:
- Creates an Express app using the existing `createApiServer` function
- Registers routes based on the provided options
- Sets up signal handlers for SIGTERM and SIGINT
- Implements graceful shutdown that closes the server and waits for existing connections to finish

## Configuration Options

### createApiServer Options

```typescript
const apiServer = createApiServer({
  port: 4000, // Default: 3001
  enableCors: true, // Default: true
  enableHelmet: true, // Default: true
  enableJsonBodyParser: true, // Default: true
});
```

### createServiceServer Options

```typescript
const { app, startServer } = createServiceServer({
  port: 4000, // Default: 3001
  enableCors: true, // Default: true
  enableHelmet: true, // Default: true
  enableJsonBodyParser: true, // Default: true
  routes: (app) => {
    // Register your routes here
    app.get('/api/hello', (req, res) => {
      res.json({ message: 'Hello, world!' });
    });
  }
});
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```
