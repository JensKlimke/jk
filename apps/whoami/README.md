# Whoami TypeScript

A TypeScript web application that returns header information in JSON format, similar to the functionality of the whoami service.

## Features

- Returns server and request information in JSON format
- Generates and stores a unique application ID in MongoDB
- Includes the unique ID in the response
- Follows SOA (Service-Oriented Architecture) principles
- Structured logging with Winston

## Architecture

The application follows a service-oriented architecture with the following components:

- **Express Server**: Handles HTTP requests and responses
- **Whoami Service**: Retrieves and formats header information
- **Database Service**: Manages MongoDB connectivity with retry mechanism and unique ID storage/retrieval
- **Logger**: Provides structured logging using Winston

## API

### GET /

Returns a JSON object with the following information:

- `hostname`: The hostname of the server
- `ips`: Array of IP addresses of the server
- `remoteAddr`: The remote address of the client
- `headers`: All headers from the request
- `apiId`: The unique application ID

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB

### Installation

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Run the application
npm start
```

### Environment Variables

- `PORT`: The port to run the server on (default: 3000)
- `MONGO_WEB_USER`: The username for MongoDB authentication (default: 'web')
- `MONGO_WEB_PASSWORD`: The password for the MongoDB web user (default: 'webpassword')
- `MONGO_UPSTREAM_URL`: The MongoDB connection URL (default: 'mongodb:27017')
- `HOSTNAME`: The hostname of the server (automatically set in Docker)
- `LOG_LEVEL`: The logging level (default: 'info' in production, 'debug' in development)
- `LOG_OUTPUT`: Determine where logs are output (options: 'console', 'file', 'both'; default: 'both')
- `NODE_ENV`: Set to 'production' for production environment

Note: The application will automatically retry connecting to MongoDB until a connection is established, ensuring that the app starts properly even if MongoDB is not immediately available.

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Docker

The application is containerized and can be run using Docker Compose. See the `docker-compose.apps.yml` file for configuration.

```bash
# Run with Docker Compose
docker-compose -f docker-compose.apps.yml up -d
```

## Logging

The application uses Winston for structured logging:

- Configurable log output (console, file, or both) via the `LOG_OUTPUT` environment variable
- Log files are stored in the `logs` directory when file logging is enabled
- Separate log file for errors (`logs/error.log`)
- Combined log file for all logs (`logs/combined.log`)
- JSON format for structured logging
- Different log levels based on environment

For more details, see the [logging documentation](src/utils/README.md).

## License

This project is part of the JK repository and is subject to its license.
