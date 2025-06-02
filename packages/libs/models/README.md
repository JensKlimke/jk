# Models Package

Shared data models library for the JK project.

## Overview

This package contains TypeScript interfaces and types that define the data structures used throughout the JK project. It's designed to be imported by both frontend and backend packages to ensure consistent data structures across the application.

## Features

- TypeScript interfaces for all data models
- Shared between frontend and backend
- Ensures type safety across the application

## Development

### Installation

```bash
npm install
```

### Building the Package

```bash
# Build the package
npm run build

# Clean the build output
npm run clean
```

## Usage

Import the models in your code:

```typescript
import { ExampleModel } from '@jk/models';

// Use the model
const example: ExampleModel = {
  id: '1',
  name: 'Example',
  description: 'This is an example',
  createdAt: new Date()
};
```

## Testing

The package includes tests to verify the model interfaces.

### Running Tests

```bash
npm test
```

### Test Coverage

Test coverage reports are generated in the `coverage` directory.