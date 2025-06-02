# App Package

React frontend application for the JK project.

## Features

- Modern React application with hooks
- Fetches and displays data from the API
- Uses shared models from `@jk/models`

## Development

### Installation

```bash
npm install
```

### Running the Application

```bash
# Development mode with hot-reload
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

## Testing

The application includes tests for components and services.

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

The tests verify:

1. **App Component**
   - Renders without crashing
   - Displays loading state while fetching data
   - Displays example items when data is loaded
   - Handles errors gracefully

2. **API Service**
   - Makes correct API calls
   - Handles successful responses
   - Handles error responses