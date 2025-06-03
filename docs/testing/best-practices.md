# Test Best Practices

This guide outlines the best practices for writing tests in the JK project.

## Overview

Following consistent testing practices ensures that tests are reliable, maintainable, and effective at catching bugs. This guide covers the recommended approaches for testing different types of components in the JK project.

## General Best Practices

### Test Structure

- **Arrange, Act, Assert**: Structure tests using the AAA pattern:
  - **Arrange**: Set up the test data and conditions
  - **Act**: Perform the action being tested
  - **Assert**: Verify the results

- **Descriptive Test Names**: Use descriptive names that explain what the test is checking:
  ```javascript
  test('should return an array of examples when getExamples is called', () => {
    // Test implementation
  });
  ```

- **Group Related Tests**: Use `describe` blocks to group related tests:
  ```javascript
  describe('getExamples', () => {
    test('should return an array of examples', () => {
      // Test implementation
    });
    
    test('should handle empty data', () => {
      // Test implementation
    });
  });
  ```

### Test Independence

- **Isolated Tests**: Each test should be independent and not rely on the state from other tests
- **Reset State**: Clean up any changes made during the test to avoid affecting other tests
- **Mock External Dependencies**: Use mocks for external services, APIs, and databases

### Test Coverage

- **Cover Edge Cases**: Test not just the happy path, but also edge cases and error conditions
- **Aim for High Coverage**: Strive for high test coverage, but focus on critical paths and complex logic
- **Don't Test Implementation Details**: Test behavior, not implementation details, to allow for refactoring

## Testing Specific Components

### Testing API Endpoints

- **Use Supertest**: Use the Supertest library to make HTTP requests to your Express app
- **Test Status Codes**: Verify that endpoints return the correct status codes
- **Test Response Bodies**: Verify that response bodies match the expected format and data
- **Test Error Handling**: Verify that endpoints handle errors correctly

Example:

```javascript
import request from 'supertest';
import app from '../src/index';

describe('GET /api/examples', () => {
  test('should return 200 and an array of examples', async () => {
    const response = await request(app).get('/api/examples');
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });
});
```

### Testing React Components

- **Use React Testing Library**: Use React Testing Library to test components from a user's perspective
- **Test User Interactions**: Test how components respond to user interactions
- **Test Rendering**: Verify that components render correctly with different props
- **Test Accessibility**: Verify that components are accessible

Example:

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import ExampleList from '../src/components/ExampleList';

describe('ExampleList', () => {
  test('should render a list of examples', () => {
    const examples = [
      { id: '1', name: 'Example 1', description: 'Description 1' },
      { id: '2', name: 'Example 2', description: 'Description 2' }
    ];
    
    render(<ExampleList examples={examples} />);
    
    expect(screen.getByText('Example 1')).toBeInTheDocument();
    expect(screen.getByText('Example 2')).toBeInTheDocument();
  });
  
  test('should show a message when there are no examples', () => {
    render(<ExampleList examples={[]} />);
    
    expect(screen.getByText('No examples found.')).toBeInTheDocument();
  });
});
```

### Testing API Services

- **Mock Axios**: Use Jest to mock Axios or other HTTP clients
- **Test Success and Error Cases**: Test both successful API calls and error handling
- **Verify Request Parameters**: Verify that the correct parameters are sent to the API

Example:

```javascript
import axios from 'axios';
import { getExamples } from '../src/services/api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('getExamples', () => {
  test('should return examples when API call is successful', async () => {
    const mockData = [
      { id: '1', name: 'Example 1', description: 'Description 1' }
    ];
    
    mockedAxios.get.mockResolvedValueOnce({ data: mockData });
    
    const result = await getExamples();
    
    expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3001/api/examples');
    expect(result).toEqual(mockData);
  });
  
  test('should handle errors', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('API error'));
    
    await expect(getExamples()).rejects.toThrow('API error');
  });
});
```

### Testing Utility Functions

- **Test Input/Output**: Test various inputs and verify the expected outputs
- **Test Edge Cases**: Test edge cases like empty inputs, null values, etc.
- **Test Performance**: For performance-critical functions, consider testing performance

Example:

```javascript
import { formatDate } from '../src/utils/date';

describe('formatDate', () => {
  test('should format date correctly', () => {
    const date = new Date('2023-01-15T12:00:00Z');
    expect(formatDate(date)).toBe('2023-01-15');
  });
  
  test('should handle invalid date', () => {
    expect(() => formatDate(null)).toThrow();
  });
});
```

## Mocking Best Practices

### When to Mock

- **External Services**: Always mock external services like APIs, databases, etc.
- **Complex Dependencies**: Mock complex dependencies to isolate the unit being tested
- **Side Effects**: Mock functions that have side effects (e.g., writing to a file)

### How to Mock

- **Jest Mock Functions**: Use Jest's `jest.fn()` for simple function mocks
- **Module Mocks**: Use `jest.mock()` to mock entire modules
- **Manual Mocks**: Create manual mocks in `__mocks__` directories for complex modules

### Mock Implementation

- **Keep Mocks Simple**: Implement only what's necessary for the test
- **Verify Mock Calls**: Verify that mocks are called with the expected parameters
- **Reset Mocks Between Tests**: Use `beforeEach(() => jest.clearAllMocks())` to reset mocks

## Handling Asynchronous Tests

- **Use Async/Await**: Use async/await for cleaner asynchronous tests
- **Test Promises**: For promise-based code, test both resolved and rejected states
- **Set Appropriate Timeouts**: Set appropriate timeouts for tests that might take longer

Example:

```javascript
test('should handle async operations', async () => {
  const result = await someAsyncFunction();
  expect(result).toBe(expectedValue);
});
```

## Continuous Integration

- **Run Tests on CI**: Ensure tests run on every pull request and push to main
- **Fail CI on Test Failures**: Configure CI to fail if tests fail
- **Track Coverage**: Track test coverage over time to prevent regressions

## Next Steps

- Return to [test configuration](configuration.md)
- Learn how to [run tests](running-tests.md)