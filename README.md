# JK - Infrastructure and Applications

[![CI](https://github.com/JensKlimke/jk/actions/workflows/ci.yml/badge.svg)](https://github.com/JensKlimke/jk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-18.x-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![ESLint](https://img.shields.io/badge/ESLint-8.57.0-4B32C3.svg)](https://eslint.org/)
[![Prettier](https://img.shields.io/badge/Prettier-3.2.5-F7B93E.svg)](https://prettier.io/)

This monorepo contains infrastructure setup and applications for the JK project. It's designed to support web applications, backend services, infrastructure setups, documentation, and shared libraries.

## Quick Overview

The JK project consists of:

- A React frontend application
- An Express.js API backend
- A WHOIS service
- Shared libraries for models and API server functionality
- Docker support for all services
- Comprehensive testing and CI/CD setup

For detailed documentation, see the [docs folder](docs/README.md).

## Project Structure

```
jk/
├── docs/             # Documentation
├── packages/
│   ├── libs/         # Libraries
│   │   ├── models/   # Shared data models library
│   │   └── api-server/ # Common API server functionality
│   ├── apps/         # Web applications
│   │   └── app/      # React frontend application
│   └── services/     # Server applications
│       ├── api/      # Express API backend
│       └── whois/    # WHOIS service
├── package.json      # Root package.json with workspaces configuration
└── tsconfig.json     # Base TypeScript configuration
```

## Key Features

- **Monorepo Structure**: Organized with npm workspaces for efficient dependency management
- **TypeScript**: Used throughout the project for type safety
- **React Frontend**: Modern React application built with Vite
- **Express.js Backend**: RESTful API endpoints with proper error handling
- **Docker Support**: Containerization for all services with Docker Compose
- **Testing**: Comprehensive test suite using Jest
- **CI/CD**: GitHub Actions workflow for continuous integration

## Getting Started

For detailed installation and setup instructions, see the [Getting Started Guide](docs/getting-started/installation.md).

### Quick Start

```bash
# Clone the repository
git clone https://github.com/JensKlimke/jk.git
cd jk

# Install dependencies
npm install

# Build all packages
npm run build

# Run in development mode
npm run dev --workspace=@jk/api    # Start API server
npm run dev --workspace=@jk/whois  # Start WHOIS service
npm run dev --workspace=@jk/app    # Start frontend app
```

### Docker Quick Start

```bash
# Build and run all services
docker-compose up -d

# Access the services
# Frontend: http://app.localhost
# API: http://api.localhost
# WHOIS: http://whois.localhost
```

## Development

The JK project is designed to make development easy and efficient. For detailed development guidelines, see the [Development Guide](docs/development/adding-packages.md).

### Key Development Features

- **Monorepo Structure**: Changes to shared code are immediately available to dependent packages
- **TypeScript**: Strong typing throughout the codebase
- **Hot Reloading**: Development servers with hot reloading for faster development
- **Code Quality Tools**: ESLint and Prettier for consistent code style

### Common Commands

```bash
# Lint all packages
npm run lint

# Format all code
npm run format

# Run tests
npm test

# Clean build artifacts and reinstall dependencies
npm run clean
```

## Testing

The JK project has a comprehensive test suite using Jest. For detailed testing information, see the [Testing Guide](docs/testing/configuration.md).

### Testing Features

- **Jest Framework**: Used for all testing across the project
- **Centralized Configuration**: Common test configuration with package-specific extensions
- **Mocking**: Comprehensive mocking of external dependencies
- **Coverage Reports**: Test coverage tracking for all packages

### Running Tests

```bash
# Run all tests
npm test

# Run tests for a specific package
npm test --workspace=@jk/api
```

For more details on running tests, see the [Running Tests Guide](docs/testing/running-tests.md).

## Continuous Integration

The project uses GitHub Actions for continuous integration. For details, see the [CI/CD Guide](docs/ci-cd/github-actions.md).

### CI Features

- **Automated Workflow**: Tests run automatically on pushes and pull requests
- **Linting**: Code quality checks with ESLint
- **Testing**: Automated test runs with Jest
- **Build Verification**: Ensures all packages build correctly

## Docker

The JK project includes comprehensive Docker support for all services. For detailed Docker information, see the [Docker Setup Guide](docs/docker/setup.md).

### Docker Features

- **Containerized Services**: Each service runs in its own container
- **Docker Compose**: Easy orchestration of all services
- **Nginx Reverse Proxy**: Routes requests to the appropriate service
- **Environment Configuration**: Configurable service URLs and domains

### Docker Quick Start

```bash
# Build and run all services
docker-compose up -d

# Access the services
# Frontend: http://app.localhost
# API: http://api.localhost
# WHOIS: http://whois.localhost

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

For more details on Docker configuration, see the [Docker Configuration Guide](docs/docker/configuration.md).

For more details on building and running with Docker, see the [Docker Usage Guide](docs/docker/usage.md).

## Architecture

The JK project follows a modular architecture with clear separation of concerns. For detailed architecture information, see the [Architecture Overview](docs/architecture/overview.md).

### Architecture Highlights

- **Modular Design**: Clear separation between frontend, backend, and shared code
- **Shared Libraries**: Common code extracted into reusable libraries
- **Service-Based**: Independent services that communicate via HTTP APIs
- **Scalable**: Components can be developed and deployed independently

## Documentation

For comprehensive documentation on all aspects of the JK project, see the [Documentation Index](docs/README.md).

## License

This project is licensed under the MIT License - see the LICENSE file for details.
