/**
 * Tests for the App component
 * 
 * These tests verify that the App component renders correctly and handles
 * different states (loading, error, data) appropriately.
 */
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import { getExamples } from '../services/api';
import { ExampleModel } from '@jk/models';

// Mock the API service
jest.mock('../services/api');
const mockedGetExamples = getExamples as jest.MockedFunction<typeof getExamples>;

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
  it('should show loading state initially', () => {
    // Mock the API call to return a promise that doesn't resolve immediately
    mockedGetExamples.mockImplementation(() => new Promise(() => {}));
    
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
    
    render(<App />);
    
    // Wait for the examples to be displayed
    await waitFor(() => {
      expect(screen.getByText('Examples from API')).toBeInTheDocument();
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
    
    render(<App />);
    
    // Wait for the no examples message to be displayed
    await waitFor(() => {
      expect(screen.getByText('No examples found.')).toBeInTheDocument();
    });
  });

  /**
   * Test case for error handling
   * 
   * This test verifies that the App component shows an error message
   * when the API call fails.
   */
  it('should display an error message when API call fails', async () => {
    // Mock API error
    mockedGetExamples.mockRejectedValue(new Error('API Error'));
    
    render(<App />);
    
    // Wait for the error message to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch examples/i)).toBeInTheDocument();
    });
  });
});