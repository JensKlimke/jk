# Running Tests

This guide explains how to run tests in the JK project.

## Overview

The JK project uses Jest for testing across all packages. Tests can be run for all packages at once or for individual packages.

## Prerequisites

Before running tests, ensure that:

1. All dependencies are installed: `npm install`
2. The models package is built (if testing packages that depend on it): `npm run build:models`

## Running All Tests

To run tests for all packages:

```bash
npm test
```

This command:
1. Builds all packages (to ensure dependencies are available)
2. Runs tests for all packages that have test scripts defined in their `package.json`

## Running Tests for a Specific Package

To run tests for a specific package:

```bash
# Run tests for the models package
npm test --workspace=@jk/models

# Run tests for the API package
npm test --workspace=@jk/api

# Run tests for the app package
npm test --workspace=@jk/app
```

## Running Tests in Watch Mode

During development, it's often useful to run tests in watch mode, which automatically reruns tests when files change:

```bash
# Run tests in watch mode for a specific package
npm run test:watch --workspace=@jk/api
```

Note: The `test:watch` script must be defined in the package's `package.json`.

## Building Dependencies Before Testing

When testing packages that depend on other packages in the monorepo, you may need to build those dependencies first:

```bash
# Build the models package before testing the API package
npm run build:models
npm test --workspace=@jk/api
```

This is particularly important when:
- You've made changes to the models package
- You're running tests for a package that depends on the models package
- You haven't run a full build with `npm run build`

## Viewing Test Coverage

Test coverage reports are generated in the `coverage` directory of each package when tests are run. To view the coverage report:

1. Run tests with coverage: `npm test`
2. Open the coverage report in a browser: `open packages/services/api/coverage/lcov-report/index.html` (replace with the path to the package you're interested in)

## Understanding Test Output

When tests run, Jest provides output that includes:

- The number of test suites and tests run
- The number of tests that passed, failed, or were skipped
- The time taken to run the tests
- Detailed information about any failures

Example output:

```
PASS packages/libs/models/__tests__/example.test.ts
PASS packages/services/api/__tests__/routes/example.test.ts
PASS packages/apps/app/__tests__/App.test.tsx

Test Suites: 3 passed, 3 total
Tests:       8 passed, 8 total
Snapshots:   0 total
Time:        3.5s
```

## Debugging Tests

If tests are failing, you can:

1. **Use verbose output**: `npm test -- --verbose`
2. **Run a specific test file**: `npm test -- packages/services/api/__tests__/routes/example.test.ts`
3. **Run tests with a specific name**: `npm test -- -t "should return an array of examples"`

## Common Issues and Solutions

### Tests Can't Find Dependencies

If tests can't find dependencies from other packages in the monorepo:

1. Make sure you've built the dependencies: `npm run build:models`
2. Check that the package.json correctly lists the dependencies
3. Verify that the import paths in your code are correct

### Tests Timeout

If tests are timing out:

1. Check for asynchronous operations that aren't properly resolved
2. Increase the timeout in the test configuration: `jest.setTimeout(10000)`
3. Look for infinite loops or blocking operations

### Mocking Issues

If you're having trouble with mocks:

1. Verify that mock files are in the correct location
2. Check that the mock implementation matches the interface of the real module
3. Ensure that mocks are properly set up before tests run

## Next Steps

- Learn about [test best practices](best-practices.md)
- Return to [test configuration](configuration.md)