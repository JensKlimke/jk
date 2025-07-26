# Auth Service

A TypeScript-based GitHub OAuth authentication middleware service for Traefik reverse proxy. Provides secure authentication using GitHub OAuth with session management and cookie-based authentication.

## Setup and Configuration

### Prerequisites

- Node.js 18+ (Alpine Linux compatible)
- Docker and Docker Compose
- GitHub OAuth App credentials

### Environment Variables

The service requires the following environment variables:

```bash
GITHUB_CLIENT_ID=your_github_oauth_app_id
GITHUB_CLIENT_SECRET=your_github_oauth_app_secret
DOMAIN=yourdomain.com                    # localhost for development
NODE_ENV=production                      # or development
LOG_LEVEL=info                           # error, warn, info, debug (optional)
```

### GitHub OAuth App Setup

1. Create a GitHub OAuth App in your GitHub settings
2. Set the Authorization callback URL to: `https://auth.yourdomain.com/auth/callback`
3. For development: `http://auth.localhost/auth/callback`
4. Copy the Client ID and Client Secret to your environment variables

### Development Setup

```bash
# Navigate to auth service directory
cd services/auth

# Install dependencies
npm install

# Run in development mode
npm run dev

# Run with file watching
npm run watch
```

### Production Deployment

The service is containerized and deployed via Docker Compose:

```bash
# Build and start the service
docker-compose up -d auth

# The service will be available at:
# - Development: http://auth.localhost
# - Production: https://auth.yourdomain.com
```

## Architecture and Features

### Core Components

#### AuthService (`src/service/AuthService.ts`)
- **GitHub OAuth Integration**: Handles complete OAuth flow with GitHub
- **Session Management**: In-memory session storage using Map data structure
- **Cookie Authentication**: Secure cookie-based authentication with configurable options
- **Environment Awareness**: Supports both development (HTTP) and production (HTTPS) environments
- **Request Context**: Extracts origin URLs from Traefik forwarded headers

#### AuthController (`src/controllers/AuthController.ts`)
- **Authentication Check**: Validates user authentication status via cookies
- **OAuth Callback Handling**: Processes GitHub OAuth callbacks and establishes sessions
- **Header Management**: Sets required authentication headers for Traefik integration

#### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth` | GET | Authentication check - returns 200 if authenticated or redirects to GitHub OAuth |
| `/auth/callback` | GET | OAuth callback handler - processes GitHub authorization and sets session cookies |
| `/health` | GET | Health check endpoint returning service status and timestamp |

### Features

- **GitHub OAuth Authentication**: Complete OAuth 2.0 flow with GitHub
- **Session Management**: Secure session handling with UUID-based session IDs
- **Cookie Security**: HTTP-only, secure cookies with domain and SameSite configuration
- **Traefik Integration**: Compatible with Traefik ForwardAuth middleware
- **Environment Flexibility**: Automatic HTTP/HTTPS detection based on environment
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Health Monitoring**: Built-in health check endpoint for service monitoring

### Logging

The service uses **Winston** for structured logging with multiple log levels and environment-aware configuration:

#### Log Levels

- **error**: Error messages and exceptions
- **warn**: Warning messages for potential issues
- **info**: General informational messages (default in production)
- **debug**: Detailed debugging information (default in development)

#### Configuration

- **Development**: Colorized console output with timestamps
- **Production**: JSON-formatted logs with file output
- **Log Level**: Configurable via `LOG_LEVEL` environment variable
- **File Logging**: In production, logs are written to:
  - `logs/error.log` - Error level logs only
  - `logs/combined.log` - All log levels
  - `logs/exceptions.log` - Uncaught exceptions
  - `logs/rejections.log` - Unhandled promise rejections

#### Usage Examples

```typescript
import logger from './utils/logger';

logger.error('Authentication failed', { userId: 'user123', error: 'Invalid token' });
logger.warn('Rate limit approaching', { requests: 95, limit: 100 });
logger.info('User authenticated successfully', { userId: 'user123' });
logger.debug('Processing OAuth callback', { code: 'abc123', state: 'xyz789' });
```

### Security Features

- **Secure Cookies**: HTTP-only cookies with secure flag in production
- **Domain Scoping**: Cookies scoped to specific domains
- **Session Isolation**: Each user session is isolated with unique session IDs
- **HTTPS Enforcement**: Automatic HTTPS in production environments
- **OAuth Scope Limitation**: Minimal GitHub permissions (user:email)

### Integration with Traefik

The service works as a ForwardAuth middleware for Traefik:

1. Traefik forwards authentication requests to `/auth` endpoint
2. Service checks for valid authentication cookie
3. If authenticated: Returns 200 with user headers (`X-User-Id`, `X-User-Role`)
4. If not authenticated: Redirects to GitHub OAuth with origin URL preserved
5. After OAuth completion: Redirects back to original requested URL

## Test Concept

### Testing Strategy

The auth service implements a comprehensive three-tier testing approach:

#### 1. Unit Tests (`tests/unit/`)
- **AuthService.test.ts**: Tests core authentication logic, OAuth flow, and session management
- **AuthController.test.ts**: Tests HTTP request/response handling and endpoint behavior
- **routes.test.ts**: Tests route configuration and middleware integration

**Focus**: Individual component functionality, mocking external dependencies (GitHub API, HTTP requests)

#### 2. Integration Tests (`tests/integration/`)
- **auth-integration.test.ts**: Tests complete authentication flow with real HTTP requests
- Tests interaction between AuthService and AuthController
- Validates cookie handling and session persistence

**Focus**: Component interaction and data flow between service layers

#### 3. End-to-End Tests (`tests/e2e/`)
- **app.e2e.test.ts**: Tests complete application behavior from HTTP request to response
- Simulates real user authentication scenarios
- Tests error handling and edge cases

**Focus**: Complete user workflows and system behavior

### Testing Framework and Tools

- **Jest**: Primary testing framework with TypeScript support
- **Supertest**: HTTP assertion library for API endpoint testing
- **Axios Mocking**: Mock GitHub API responses for isolated testing
- **Coverage Reporting**: Comprehensive code coverage analysis

### Test Scripts

```bash
# Run all tests
npm test

# Run with file watching
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test suites
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:e2e        # End-to-end tests only
```

### Test Configuration

- **Jest Configuration**: `jest.config.js` with TypeScript support
- **Test Setup**: `tests/setup.ts` for global test configuration
- **Mocking Strategy**: External API calls mocked for reliable, fast tests
- **Coverage Thresholds**: Enforced code coverage requirements

### Testing Best Practices

- **Isolation**: Each test is independent with proper setup/teardown
- **Mocking**: External dependencies (GitHub API) are mocked for reliability
- **Assertions**: Comprehensive assertions covering success and error scenarios
- **Edge Cases**: Tests cover authentication failures, invalid tokens, and network errors
- **Performance**: Fast test execution with minimal external dependencies

The testing approach ensures reliability, maintainability, and confidence in the authentication service's behavior across different scenarios and environments.