# Test Configuration

This guide explains how the testing framework is configured in the JK project.

## Overview

The JK project uses Jest for testing across all packages. The test configuration is centralized at the root level and extended by each package to ensure consistency while allowing for package-specific customization.

## Root Configuration

The root Jest configuration is defined in `jest.config.js` at the root of the project. This configuration:

- Sets up the TypeScript environment
- Defines common patterns for test files
- Configures code coverage reporting
- Sets up common mocks and transformations

## Package-Specific Configuration

Each package has its own `jest.config.js` file that extends the root configuration. This allows packages to:

- Override settings as needed
- Add package-specific mocks or transformations
- Configure environment-specific settings (e.g., DOM environment for React components)

### Example Package Configuration

Here's an example of a package-specific Jest configuration:

```javascript
/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/*.d.ts',
  ],
  // Setup files for React testing
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  // Setup files to run before tests
  setupFiles: ['<rootDir>/src/__mocks__/viteMock.js'],
  // Mock CSS imports
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js'
  }
};
```

## Test File Structure

Tests are organized within each package's directory structure:

- **API Package**: Tests for API routes and server functionality
- **App Package**: Tests for React components and API service functions
- **Models Package**: Tests for data model interfaces

Each package follows the convention of placing tests in `__tests__` directories, with test files named with a `.test.ts` or `.test.tsx` extension.

## Mocks

### Mock Files

Mock files are placed in `__mocks__` directories within each package. These mocks can be:

1. **Automatic mocks**: Jest automatically mocks modules placed in a `__mocks__` directory adjacent to `node_modules`
2. **Manual mocks**: Explicitly created mock implementations for specific modules

### Example: Mocking Vite Environment Variables

For the frontend application, which uses Vite, environment variables are mocked in `src/__mocks__/viteMock.js`:

```javascript
// Mock for Vite's import.meta.env
global.import = {
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:3001/api',
      VITE_WHOIS_URL: 'http://localhost:3002/api',
      MODE: 'test',
      DEV: false,
      PROD: true
    }
  }
};
```

### Example: Mocking CSS Imports

CSS imports are mocked to prevent them from causing issues during testing:

```javascript
// src/__mocks__/styleMock.js
module.exports = {};
```

## Coverage Configuration

Code coverage is configured to:

- Generate reports in the `coverage` directory of each package
- Include all TypeScript files in the `src` directory
- Exclude declaration files (`.d.ts`)

Coverage reports can be viewed by opening the `coverage/lcov-report/index.html` file in a browser after running tests.

## TypeScript Integration

Jest is configured to work with TypeScript using `ts-jest`, which:

- Compiles TypeScript files on the fly during testing
- Provides type checking for tests
- Enables source mapping for better error reporting

## Environment-Specific Configuration

Different packages may require different test environments:

- **Node Environment**: Used for testing server-side code (API, services)
- **JSDOM Environment**: Used for testing browser-based code (React components)

These environments are specified in each package's Jest configuration.

## Next Steps

- Learn how to [run tests](running-tests.md)
- Explore [test best practices](best-practices.md)