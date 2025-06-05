# JK Project Documentation

Welcome to the JK Project documentation. This documentation provides information about the JK project, focusing on system setup and component integration.

## Documentation Sections

### Getting Started
- [Installation](getting-started/installation.md)
- [Building the Packages](getting-started/building.md)
- [Running the Applications](getting-started/running.md)

### Development
- [Adding New Packages](development/adding-packages.md)
- [Linting and Formatting](development/linting-formatting.md)

### Testing
- [Test Configuration](testing/configuration.md)
- [Running Tests](testing/running-tests.md)
- [Test Best Practices](testing/best-practices.md)

### CI/CD
- [GitHub Actions Workflow](ci-cd/github-actions.md)

### Docker
- [Docker Setup](docker/setup.md)
- [Configuring Service URLs](docker/configuration.md)
- [Building and Running with Docker](docker/usage.md)

### Architecture
- [System Architecture Overview](architecture/overview.md)

### Operations
- [Graceful Shutdown Implementation](graceful-shutdown.md)

## API Libraries

The JK project includes shared libraries that can be used across different components:

- **API Server Library**: Located at `packages/libs/api-server`, this library provides utilities for creating and managing API servers with common middleware and graceful shutdown support. See the [API Server README](../packages/libs/api-server/README.md) for details.

## Contributing to Documentation

If you'd like to contribute to the documentation, please follow these guidelines:

1. Use Markdown format for all documentation files
2. Follow the existing structure and naming conventions
3. Include clear, concise explanations with examples where appropriate
4. Focus on system setup and component integration rather than specific implementations
5. Update the main README.md file if you add new documentation sections
