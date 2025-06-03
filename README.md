# JK - Infrastructure and Applications

[![CI](https://github.com/JensKlimke/jk/actions/workflows/ci.yml/badge.svg)](https://github.com/JensKlimke/jk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-18.x-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![ESLint](https://img.shields.io/badge/ESLint-8.57.0-4B32C3.svg)](https://eslint.org/)
[![Prettier](https://img.shields.io/badge/Prettier-3.2.5-F7B93E.svg)](https://prettier.io/)

This monorepo contains infrastructure setup and applications for the JK project. It's designed to support web applications, backend services, infrastructure setups, documentation, and shared libraries.

## Project Structure

```
jk/
├── packages/
│   ├── libs/           # Libraries
│   │   └── models/     # Shared data models library
│   ├── apps/           # Web applications
│   │   └── app/        # React frontend application
│   └── services/       # Server applications
│       └── api/        # Express API backend
├── package.json        # Root package.json with workspaces configuration
└── tsconfig.json       # Base TypeScript configuration
```

## Packages

### Models (`@jk/models`)

A shared library containing data models used by both the API and frontend application. This demonstrates how to share code between different packages in a monorepo.

- **Technology**: TypeScript
- **Purpose**: Define shared data structures and types

### API (`@jk/api`)

A basic Express server that provides API endpoints for the frontend application.

- **Technology**: Express.js with TypeScript
- **Features**:
  - RESTful API endpoints
  - Uses shared models from `@jk/models`
  - CORS and security headers with Helmet

### APP (`@jk/app`)

A React frontend application that consumes the API.

- **Technology**: React with TypeScript, Vite
- **Features**:
  - Fetches and displays data from the API
  - Uses shared models from `@jk/models`
  - Modern React with hooks

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```

### Building the Packages

Build all packages:
```
npm run build
```

Or build individual packages:
```
npm run build --workspace=@jk/models
npm run build --workspace=@jk/api
npm run build --workspace=@jk/app
```

### Running the Applications

#### Development Mode

Start the API server:
```
npm run dev --workspace=@jk/api
```

Start the frontend application:
```
npm run dev --workspace=@jk/app
```

#### Production Mode

To run the application in production mode, first build all packages:
```
npm run build
```

Then start the API server:
```
npm run start --workspace=@jk/api
```

And start the frontend application:
```
npm run start --workspace=@jk/app
```

The frontend application will be available at http://localhost:3000.

## Development

This monorepo is set up to facilitate development across multiple packages. When making changes to shared code in the `models` package, those changes will be immediately available to the `api` and `app` packages.

### Adding New Packages

To add a new package:

1. Determine the type of your package:
   - **Libraries**: Shared code used by multiple packages (place in `packages/libs/`)
   - **Web Applications**: Frontend applications (place in `packages/apps/`)
   - **Services**: Backend services and APIs (place in `packages/services/`)
   - For other types, create an appropriate category directory under `packages/`

2. Create a new directory in the appropriate category folder
3. Initialize it with a `package.json` file
4. The workspaces in the root `package.json` are already configured for the standard categories

### Linting and Formatting

This project uses ESLint for code linting and Prettier for code formatting to ensure consistent code style across all packages.

#### Running Linting and Formatting

From the root directory:

```bash
# Run ESLint on all packages (executes the lint command in each package)
npm run lint

# Run ESLint with auto-fix (executes the lint:fix command in each package)
npm run lint:fix

# Run Prettier to format all files (executes the format command in each package)
npm run format

# Check if files are properly formatted (executes the format:check command in each package)
npm run format:check

# Run both lint and format
npm run lint-format
```

You can also run these commands for individual packages:

```bash
# Run ESLint for a specific package
npm run lint --workspace=@jk/models

# Run Prettier for a specific package
npm run format --workspace=@jk/api
```

#### Configuration

- ESLint configuration is in `.eslintrc.js` with package-specific overrides in each package's directory
- Prettier configuration is in `.prettierrc.js`
- Ignored files are specified in `.eslintignore` and `.prettierignore`

### Testing

This project uses Jest for testing across all packages. Tests are organized within each package's directory structure.

#### Test Configuration

Jest configuration is centralized at the root level in `jest.config.js` and extended by each package:

- **Root Configuration**: Defines common settings for all packages
- **Package-Specific Configuration**: Each package extends the root configuration and adds package-specific settings

This approach ensures consistency across packages while allowing for customization where needed.

#### Running Tests

From the root directory:

```bash
# Run tests for all packages that have test scripts defined
npm test
```

This command will:
1. Build the models package first to ensure it's available to other packages
2. Run tests for all packages that have test scripts defined

You can also run tests for individual packages:

```bash
# Run tests for a specific package
npm test --workspace=@jk/api
npm test --workspace=@jk/app
npm test --workspace=@jk/models
```

Note: When running tests for packages that depend on the models package, you may need to build the models package first:

```bash
npm run build --workspace=@jk/models
npm test --workspace=@jk/api
```

#### Test Coverage

Test coverage reports are generated in the `coverage` directory of each package when tests are run.

#### Test Structure

Each package contains tests in `__tests__` directories:

- **API Package**: Tests for API routes and server functionality
- **App Package**: Tests for React components and API service functions
- **Models Package**: Tests for data model interfaces

#### Test Best Practices

The test suite follows these best practices:

- **Mocking External Dependencies**: All external dependencies (like API calls) are mocked to ensure tests are isolated and deterministic
- **Suppressing Console Errors**: Console errors are suppressed during tests that intentionally trigger error conditions to keep the test output clean
- **Testing Edge Cases**: Tests cover various scenarios including successful operations, empty data, and error handling

### Continuous Integration

This project uses GitHub Actions for continuous integration to ensure code quality and prevent regressions.

#### CI Workflow

The CI workflow runs automatically on:
- Every push to the `main` branch
- Every pull request targeting the `main` branch

The workflow currently includes the following checks:
- **Linting**: Runs ESLint on all packages to ensure code quality and consistency
- **Testing**: Runs tests for all packages that have test scripts defined

The CI configuration can be found in the `.github/workflows/ci.yml` file.

## Docker

This project includes Docker support for all services and applications, making it easy to build and run the entire system in containers.

### Docker Setup

Each package has its own Dockerfile:

- **Frontend App**: `packages/apps/app/Dockerfile`
- **API Service**: `packages/services/api/Dockerfile`
- **WHOIS Service**: `packages/services/whois/Dockerfile`

A `docker-compose.yml` file is provided at the root of the project to orchestrate all services.

### Configuring Service URLs

The frontend app is configured to communicate with the API and WHOIS services using environment variables. These are set as build arguments in the `docker-compose.yml` file:

```yaml
app:
  build:
    args:
      - VITE_API_URL=http://api:3001/api
      - VITE_WHOIS_URL=http://whois:3002/api
```

You can modify these URLs to point to different service endpoints if needed. For example, if you're running the services on different hosts or ports, you can update the URLs accordingly.

### Building and Running with Docker

To build and run all services using Docker Compose:

```bash
# Build all services
docker-compose build

# Run all services in the background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Accessing the Services

Once the containers are running, you can access the services at:

- **Frontend App**: http://localhost:80
- **API Service**: http://localhost:3001
- **WHOIS Service**: http://localhost:3002

### Building Individual Services

You can also build and run individual services:

```bash
# Build and run just the frontend app
docker-compose up -d app

# Build and run just the API service
docker-compose up -d api

# Build and run just the WHOIS service
docker-compose up -d whois
```

## Architecture

The system follows a modular architecture with clear separation of concerns:

- **Data Models**: Centralized in the `models` package
- **Backend Logic**: Contained in the `api` package
- **Frontend UI**: Implemented in the `app` package

This architecture allows for:
- Code reuse through shared libraries
- Independent development and deployment of components
- Clear boundaries between different parts of the system
