# API Package

Express API backend for the JK project.

## Features

- RESTful API endpoints for example resources
- CORS support
- Security headers with Helmet

## Development

### Installation

```bash
npm install
```

### Running the API

```bash
# Development mode with auto-reload
npm run dev

# Build for production
npm run build

# Run in production mode
npm run start
```

## Testing

The API includes functional tests to verify that endpoints work as expected.

### Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode (useful during development)
npm run test:watch
```

### Test Coverage

Test coverage reports are generated in the `coverage` directory.

## Test Cases

The functional tests verify:

1. **GET /api/examples**
   - Returns a 200 OK status
   - Returns a JSON array
   - Array contains example items with the expected structure (id, name, description, createdAt)

2. **GET /api/examples/:id**
   - Returns a 200 OK status
   - Returns a JSON object
   - Object has the expected structure (id, name, description, createdAt)
   - Object has the requested ID
   - Handles invalid IDs gracefully by returning a properly structured response

3. **API Server**
   - Server can start and listen on the expected port
   - Server can handle HTTP requests
   - Server responds appropriately to requests for unknown routes

## API Endpoints

- `GET /api/examples` - Get a list of example items
- `GET /api/examples/:id` - Get a specific example item by ID
