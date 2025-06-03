/**
 * Tests for the App component
 *
 * These tests verify that the App component renders correctly and handles
 * different states (loading, error, data) appropriately.
 */
import { ExampleModel } from '@jk/models';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import App from '../App';
import { getExamples, getWhoisInfo, WhoisResponse } from '../services/api';

// Mock the API service
jest.mock('../services/api');
const mockedGetExamples = getExamples as jest.MockedFunction<typeof getExamples>;
const mockedGetWhoisInfo = getWhoisInfo as jest.MockedFunction<typeof getWhoisInfo>;

describe('App Component', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test case for initial loading state
   *
   * This test verifies that the App component shows a loading message
   * when it first renders and is fetching data.
   */
  it('should show loading state initially', async () => {
    // Mock the API calls to return a promise that doesn't resolve immediately
    mockedGetExamples.mockImplementation(() => new Promise(() => {}));

    // Mock whois info - use a promise that doesn't resolve to prevent state updates
    mockedGetWhoisInfo.mockImplementation(() => new Promise(() => {}));

    render(<App />);

    // Check that the loading message is displayed
    expect(screen.getByText(/Loading examples/i)).toBeInTheDocument();
  });

  /**
   * Test case for successful data fetching
   *
   * This test verifies that the App component:
   * 1. Makes an API call to fetch examples
   * 2. Displays the examples when data is loaded
   */
  it('should display examples when data is loaded', async () => {
    // Mock data
    const mockExamples: ExampleModel[] = [
      {
        id: '1',
        name: 'Example 1',
        description: 'Description 1',
        createdAt: new Date(),
      },
      {
        id: '2',
        name: 'Example 2',
        description: 'Description 2',
        createdAt: new Date(),
      },
    ];

    // Mock the API call to return the mock data
    mockedGetExamples.mockResolvedValue(mockExamples);

    // Mock whois info
    const mockWhoisInfo: WhoisResponse = {
      id: 'test-id-123',
      timestamp: new Date().toISOString(),
      message: 'Test message',
    };
    mockedGetWhoisInfo.mockResolvedValue(mockWhoisInfo);

    render(<App />);

    // Wait for both the examples and whois info to be displayed
    await waitFor(() => {
      expect(screen.getByText('Examples from API')).toBeInTheDocument();
      expect(screen.getByText(`ID: ${mockWhoisInfo.id}`)).toBeInTheDocument();
    });

    // Check that the examples are displayed
    expect(screen.getByText('Example 1')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('Example 2')).toBeInTheDocument();
    expect(screen.getByText('Description 2')).toBeInTheDocument();
  });

  /**
   * Test case for empty data
   *
   * This test verifies that the App component shows an appropriate message
   * when no examples are returned from the API.
   */
  it('should display a message when no examples are found', async () => {
    // Mock empty data
    mockedGetExamples.mockResolvedValue([]);

    // Mock whois info
    const mockWhoisInfo: WhoisResponse = {
      id: 'test-id-123',
      timestamp: new Date().toISOString(),
      message: 'Test message',
    };
    mockedGetWhoisInfo.mockResolvedValue(mockWhoisInfo);

    render(<App />);

    // Wait for both the no examples message and whois info to be displayed
    await waitFor(() => {
      expect(screen.getByText('No examples found.')).toBeInTheDocument();
      expect(screen.getByText(`ID: ${mockWhoisInfo.id}`)).toBeInTheDocument();
    });
  });

  /**
   * Test case for error handling
   *
   * This test verifies that the App component shows an error message
   * when the API call fails.
   */
  it('should display an error message when API call fails', async () => {
    // Mock console.error to prevent it from cluttering the test output
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Mock API error
    mockedGetExamples.mockRejectedValue(new Error('API Error'));

    // Mock whois info
    const mockWhoisInfo: WhoisResponse = {
      id: 'test-id-123',
      timestamp: new Date().toISOString(),
      message: 'Test message',
    };
    mockedGetWhoisInfo.mockResolvedValue(mockWhoisInfo);

    render(<App />);

    // Wait for both the error message and whois info to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch examples/i)).toBeInTheDocument();
      expect(screen.getByText(`ID: ${mockWhoisInfo.id}`)).toBeInTheDocument();
    });

    // Restore console.error
    console.error = originalConsoleError;
  });
});
