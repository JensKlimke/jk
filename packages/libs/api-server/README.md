# API Server Library

Generic API server library for the JK project.

## Features

- Create Express API servers with common middleware
- Configurable CORS, Helmet, and JSON body parsing
- Simple API for starting the server

## Installation

```bash
npm install @jk/api-server
```

## Usage

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

## Configuration Options

You can customize the API server by passing options to the `createApiServer` function:

```typescript
const apiServer = createApiServer({
  port: 4000, // Default: 3001
  enableCors: true, // Default: true
  enableHelmet: true, // Default: true
  enableJsonBodyParser: true, // Default: true
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