# Graceful Shutdown Implementation

## Issue

When running services in Docker containers, it's important to properly handle shutdown signals to ensure quick and clean termination. Without proper signal handling, containers can take a long time to stop when running `docker-compose down`, as Docker waits for its timeout (default 10 seconds) before forcefully killing the containers.

## Root Causes

1. **Missing Signal Handlers**: Services need to properly handle the SIGTERM signal that Docker sends when stopping containers.
2. **No Graceful Shutdown Logic**: Express servers need to close active connections and perform cleanup when shutting down.
3. **Docker Timeout**: Docker waits up to 10 seconds (default timeout) for containers to stop before forcefully killing them with SIGKILL.

## Solution

The solution is to implement proper signal handling and graceful shutdown for all services. This is done through the `api-server` library:

1. The `createServiceServer` function in the `api-server` package:
   - Creates an Express app
   - Registers routes
   - Returns a `startServer` function that sets up signal handlers for SIGTERM and SIGINT
   - Implements a graceful shutdown function that closes the server and any active connections

2. Services can use this common function to ensure signal handlers are registered.

## Implementation Details

### Common Service Server Creation

The `createServiceServer` function in `packages/libs/api-server/src/createServiceServer.ts`:

- Creates an Express app using the existing `createApiServer` function
- Registers routes based on the provided options
- Returns a `startServer` function that:
  - Starts the server and stores the reference
  - Sets up signal handlers for SIGTERM and SIGINT
  - Implements a graceful shutdown function that:
    - Closes the server and waits for existing connections to finish
    - Exits the process with code 0 if all connections close within 5 seconds
    - Exits the process with code 1 if connections don't close within 5 seconds

### Usage in Services

Services can use the `startServer` function returned by `createServiceServer` to ensure that signal handlers are registered and the service can gracefully shut down when Docker sends a SIGTERM signal.

```typescript
import { createServiceServer } from '@jk/api-server';

const { app, startServer } = createServiceServer({
  port: 3001,
  routes: (app) => {
    // Register routes
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

## Benefits

1. **Faster Container Shutdown**: Containers stop quickly without waiting for the full 10-second Docker timeout.
2. **Proper Resource Cleanup**: Servers properly close active connections and perform cleanup when shutting down.
3. **Better User Experience**: Users don't have to wait a long time for containers to stop when running `docker-compose down`.
4. **Reduced Resource Usage**: Containers release resources more quickly, which can be important in resource-constrained environments.

## Best Practices Implemented

1. **Signal Handling**: Handlers for both SIGTERM (sent by Docker) and SIGINT (sent by Ctrl+C).
2. **Graceful Shutdown**: Proper server closing that waits for existing connections to finish.
3. **Timeout Protection**: Safety timeout to prevent hanging indefinitely.
4. **Logging**: Informative logs to track the shutdown process.

These changes follow Node.js best practices for running in containerized environments and significantly improve the shutdown experience when using Docker Compose.
