# JK Project Guidelines for Junie

## Project Overview

JK is a monorepo containing infrastructure setup and applications for the JK project. It's designed to support web applications, backend services, infrastructure setups, documentation, and shared libraries.

### Project Structure

```
jk/
├── packages/
│   ├── libs/           # Libraries
│   │   └── models/     # Shared data models library (TypeScript)
│   ├── apps/           # Web applications
│   │   └── app/        # React frontend application (TypeScript, Vite)
│   └── services/       # Server applications
│       └── api/        # Express API backend (TypeScript)
├── package.json        # Root package.json with workspaces configuration
└── tsconfig.json       # Base TypeScript configuration
```

### Key Technologies

- **Node.js** (v18.x)
- **TypeScript** (v5.0)
- **Express.js** (API backend)
- **React** (Frontend application)
- **ESLint** (v8.57.0) for linting
- **Prettier** (v3.2.5) for code formatting
- **Jest** for testing

## Guidelines for Junie

### Code Modifications

1. **Understand Dependencies**: When modifying code, be aware of dependencies between packages. The `models` package is used by both `api` and `app` packages.

2. **Maintain Code Style**: Follow the existing code style. The project uses ESLint and Prettier for code quality and formatting.

### Testing Requirements

1. **Run Tests Before Submitting**: Always run tests to verify that your changes don't break existing functionality.

2. **How to Run Tests**:
   - For all packages: `npm test` (from the root directory)
   - For a specific package: `npm test --workspace=@jk/api` (replace with the package name)

3. **Important Note**: When testing packages that depend on the models package, build the models package first:
   ```bash
   npm run build:models
   npm test --workspace=@jk/api
   ```

### Building the Project

1. **Build Before Submitting**: Always build the project to ensure your changes compile correctly.

2. **How to Build**:
   - For all packages: `npm run build` (from the root directory)
   - For a specific package: `npm run build --workspace=@jk/api` (replace with the package name)

3. **Build Order**: The `models` package should be built before other packages that depend on it.

### Code Style Guidelines

1. **Linting**: Run `npm run lint` to check for code quality issues.
2. **Formatting**: Run `npm run format` to format code according to project standards.
3. **Combined Check**: Run `npm run lint-format` to perform both linting and formatting.

### Adding New Features

1. **Package Structure**: Follow the existing package structure when adding new features.
2. **Testing**: Add appropriate tests for new functionality.
3. **Documentation**: Update documentation to reflect new features or changes.

### Continuous Integration

The project uses GitHub Actions for CI. Any changes should pass all CI checks, which include:
- Linting
- Testing

## Additional Resources

For more detailed information, refer to the project's README.md file, which contains comprehensive documentation on:
- Getting started
- Development workflows
- Testing strategies
- Architecture overview
