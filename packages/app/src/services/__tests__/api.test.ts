/**
 * Tests for the API service
 * 
 * These tests verify that the API service functions correctly interact with the backend API
 * by making HTTP requests and handling responses.
 */
import axios from 'axios';
import { getExamples, getExampleById } from '../api';
import { ExampleModel } from '@jk/models';

// Mock axios to prevent actual API calls during tests
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Service', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test case for getExamples function
   * 
   * This test verifies that:
   * 1. The function makes a GET request to the correct endpoint
   * 2. The function returns the data from the response
   */
  describe('getExamples', () => {
    it('should fetch examples from the API', async () => {
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

      // Setup mock response
      mockedAxios.get.mockResolvedValueOnce({ data: mockExamples });

      // Call the function
      const result = await getExamples();

      // Verify axios was called with the correct URL
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/examples');
      
      // Verify the function returns the expected data
      expect(result).toEqual(mockExamples);
    });

    it('should propagate errors from the API', async () => {
      // Setup mock error
      const errorMessage = 'Network Error';
      mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));

      // Call the function and expect it to throw
      await expect(getExamples()).rejects.toThrow(errorMessage);
      
      // Verify axios was called with the correct URL
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/examples');
    });
  });

  /**
   * Test case for getExampleById function
   * 
   * This test verifies that:
   * 1. The function makes a GET request to the correct endpoint with the ID
   * 2. The function returns the data from the response
   */
  describe('getExampleById', () => {
    it('should fetch a single example by ID', async () => {
      // Mock data
      const mockExample: ExampleModel = {
        id: '123',
        name: 'Example 123',
        description: 'Description 123',
        createdAt: new Date(),
      };

      // Setup mock response
      mockedAxios.get.mockResolvedValueOnce({ data: mockExample });

      // Call the function
      const result = await getExampleById('123');

      // Verify axios was called with the correct URL
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/examples/123');
      
      // Verify the function returns the expected data
      expect(result).toEqual(mockExample);
    });

    it('should propagate errors from the API', async () => {
      // Setup mock error
      const errorMessage = 'Not Found';
      mockedAxios.get.mockRejectedValueOnce(new Error(errorMessage));

      // Call the function and expect it to throw
      await expect(getExampleById('999')).rejects.toThrow(errorMessage);
      
      // Verify axios was called with the correct URL
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/examples/999');
    });
  });
});