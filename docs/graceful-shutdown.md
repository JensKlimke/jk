# Graceful Shutdown Implementation

## Issue

The issue was that it takes quite long to stop the API and WHOIS services when running `docker-compose down`. This was because the services weren't properly handling the SIGTERM signal that Docker sends when stopping containers.

## Root Causes

1. **Missing Signal Handlers**: The services weren't properly handling the SIGTERM signal that Docker sends when stopping containers.
2. **No Graceful Shutdown Logic**: The Express servers didn't close active connections or perform cleanup when shutting down.
3. **Docker Timeout**: Docker waits up to 10 seconds (default timeout) for containers to stop before forcefully killing them with SIGKILL.

## Solution

The solution was to implement proper signal handling and graceful shutdown for the API and WHOIS services. This was done by:

1. Creating a common `createServiceServer` function in the `api-server` package that:
   - Creates an Express app
   - Registers routes
   - Returns a `startServer` function that sets up signal handlers for SIGTERM and SIGINT
   - Implements a graceful shutdown function that closes the server and any active connections

2. Updating the API and WHOIS services to use this common function and ensure the signal handlers are registered.

## Implementation Details

### 1. Common Service Server Creation

The `createServiceServer` function in `packages/libs/api-server/src/createServiceServer.ts` now:

- Creates an Express app using the existing `createApiServer` function
- Registers routes based on the provided options
- Returns a `startServer` function that:
  - Starts the server and stores the reference
  - Sets up signal handlers for SIGTERM and SIGINT
  - Implements a graceful shutdown function that:
    - Closes the server and waits for existing connections to finish
    - Exits the process with code 0 if all connections close within 5 seconds
    - Exits the process with code 1 if connections don't close within 5 seconds

### 2. Service Updates

Both the API and WHOIS services were updated to use the `startServer` function returned by `createServiceServer`. This ensures that the signal handlers are registered and the services can gracefully shut down when Docker sends a SIGTERM signal.

## Testing

The changes were tested by:

1. Running the tests for all packages to ensure functionality is preserved
2. Building and running the Docker containers to verify they work correctly
3. Testing the graceful shutdown functionality by running `docker-compose down` and observing how quickly the containers stop

The test results showed that the containers now stop quickly (in about 1.5 seconds) without waiting for the full 10-second Docker timeout, confirming that the graceful shutdown functionality is working correctly.

## Benefits

1. **Faster Container Shutdown**: The containers now stop quickly without waiting for the full 10-second Docker timeout.
2. **Proper Resource Cleanup**: The servers now properly close active connections and perform cleanup when shutting down.
3. **Better User Experience**: Users no longer have to wait a long time for the containers to stop when running `docker-compose down`.
4. **Reduced Resource Usage**: The containers release resources more quickly, which can be important in resource-constrained environments.

## Best Practices Implemented

1. **Signal Handling**: Added handlers for both SIGTERM (sent by Docker) and SIGINT (sent by Ctrl+C).
2. **Graceful Shutdown**: Implemented proper server closing that waits for existing connections to finish.
3. **Timeout Protection**: Added a safety timeout to prevent hanging indefinitely.
4. **Logging**: Added informative logs to track the shutdown process.

These changes follow Node.js best practices for running in containerized environments and significantly improve the shutdown experience when using Docker Compose.