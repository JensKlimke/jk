import mongoose from 'mongoose';
import { DatabaseService } from '../src/services/database.service';
import {ApiInfoModel} from "../src/models/apiInfo.model";

// Mock mongoose
jest.mock('mongoose', () => {
  const mockConnection = {
    close: jest.fn().mockResolvedValue(undefined),
    readyState: 0
  };
  return {
    connect: jest.fn().mockResolvedValue(undefined),
    connection: mockConnection,
    __setConnectionState: (state: number) => {
      mockConnection.readyState = state;
    }
  };
});

// Mock ApiInfoModel
jest.mock('../src/models/apiInfo.model', () => {
  return {
    ApiInfoModel: {
      findOne: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn().mockResolvedValue(undefined)
    }
  };
});

describe('DatabaseService', () => {
  let databaseService: DatabaseService;
  const testUri = 'mongodb://mock:27017/test_whoami';

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Create database service with test URI
    databaseService = new DatabaseService(testUri);
  });

  describe('constructor', () => {
    it('should use default URI if not provided', () => {
      // Create a new instance without specifying URI
      const defaultDbService = new DatabaseService();

      // Verify that the default URI is set
      expect((defaultDbService as any).uri).toBeDefined();

      // Verify that the URI is a string that contains expected parts
      const uri = (defaultDbService as any).uri;
      expect(typeof uri).toBe('string');
      expect(uri).toContain('mongodb://');
      expect(uri).toContain('/web?authSource=admin');
    });

    it('should use custom URI if provided', () => {
      // Create a new instance with a custom URI
      const customUri = 'mongodb://custom:27017/test';
      const customDbService = new DatabaseService(customUri);

      // Verify that the custom URI is used
      expect((customDbService as any).uri).toBe(customUri);
    });
  });

  describe('connect', () => {
    it('should connect to MongoDB using Mongoose', async () => {
      // Set up the mock to update connection state
      (mongoose as any).__setConnectionState(1);

      await databaseService.connect();

      // Verify connect was called with the correct URI
      expect(mongoose.connect).toHaveBeenCalledWith(testUri);
      expect(mongoose.connection.readyState).toBe(1); // 1 means connected
    });

    it('should handle connection errors', async () => {
      // Mock the connect method to throw an error
      (mongoose.connect as jest.Mock).mockRejectedValueOnce(new Error('Connection error'));

      // Expect the connect method to throw
      await expect(databaseService.connect()).rejects.toThrow('Connection error');
    });
  });

  describe('connectWithRetry', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      // Reset the mongoose.connect mock to its default behavior
      (mongoose.connect as jest.Mock).mockResolvedValue(undefined);
    });

    afterEach(() => {
      jest.useRealTimers();
      // Reset the mongoose.connect mock to its default behavior
      (mongoose.connect as jest.Mock).mockResolvedValue(undefined);
    });

    it('should connect to MongoDB on first attempt if successful', async () => {
      // Set up the mock to update connection state
      (mongoose as any).__setConnectionState(1);

      // Create a promise that will resolve when connectWithRetry completes
      const connectPromise = databaseService.connectWithRetry();

      // Resolve any pending promises
      await Promise.resolve();

      // Verify connect was called with the correct URI
      expect(mongoose.connect).toHaveBeenCalledWith(testUri);
      expect(mongoose.connect).toHaveBeenCalledTimes(1);

      await connectPromise;
    });

    it('should retry connection if first attempt fails', async () => {
      // Mock the connect method to fail once then succeed
      (mongoose.connect as jest.Mock)
        .mockRejectedValueOnce(new Error('Connection error'))
        .mockImplementationOnce(() => {
          (mongoose as any).__setConnectionState(1);
          return Promise.resolve();
        });

      // Start the connection process
      const connectPromise = databaseService.connectWithRetry();

      // Resolve the first attempt (which fails)
      await Promise.resolve();

      // Fast-forward timer to trigger retry
      jest.advanceTimersByTime(1000);

      // Resolve the second attempt (which succeeds)
      await Promise.resolve();

      // Verify connect was called twice
      expect(mongoose.connect).toHaveBeenCalledTimes(2);

      await connectPromise;
    });

    it('should throw error after maximum retries', async () => {
      // Mock setTimeout to execute immediately
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });

      // Mock the connect method to always fail
      (mongoose.connect as jest.Mock).mockRejectedValue(new Error('Connection error'));

      // Use a small number of retries
      const maxRetries = 2;

      // Start the connection process
      const connectPromise = databaseService.connectWithRetry(maxRetries, 10);

      // Expect the promise to reject with the correct error message
      await expect(connectPromise).rejects.toThrow(`Failed to connect to MongoDB after ${maxRetries} attempts`);

      // Verify connect was called the expected number of times
      expect(mongoose.connect).toHaveBeenCalledTimes(maxRetries);

      // Restore the original setTimeout
      (global.setTimeout as unknown as jest.Mock).mockRestore();
    });
  });

  describe('getOrCreateApiId', () => {
    beforeEach(async () => {
      // Reset mocks before each test
      jest.clearAllMocks();
      // Reset the mongoose.connect mock to its default behavior
      (mongoose.connect as jest.Mock).mockResolvedValue(undefined);
      // Set connection state to connected
      (mongoose as any).__setConnectionState(1);
      await databaseService.connect();
    });

    afterEach(async () => {
      await databaseService.close();
      // Reset the mongoose.connect mock to its default behavior
      (mongoose.connect as jest.Mock).mockResolvedValue(undefined);
    });

    it('should return existing app ID if found', async () => {
      // Mock finding an existing app ID
      const existingApiId = 'existing-app-id';
      const mockApiInfo = {
        _id: 'app_id',
        apiId: existingApiId,
        createdAt: new Date()
      };

      // Mock the findOne method to return the existing app info
      (ApiInfoModel.findOne as jest.Mock).mockResolvedValueOnce(mockApiInfo);

      // Now get the app ID
      const apiId = await databaseService.getOrCreateApiId();

      // Verify it's the same
      expect(apiId).toBe(existingApiId);
      expect(ApiInfoModel.findOne).toHaveBeenCalled();
      expect(ApiInfoModel.create).not.toHaveBeenCalled();
    });

    it('should create new app ID if none exists', async () => {
      // Mock no existing app ID
      (ApiInfoModel.findOne as jest.Mock).mockResolvedValueOnce(null);

      // Mock the create method
      (ApiInfoModel.create as jest.Mock).mockImplementationOnce(async (data) => {
        return data;
      });

      // Get or create app ID
      const apiId = await databaseService.getOrCreateApiId();

      // Verify it was created
      expect(apiId).toBeDefined();
      expect(ApiInfoModel.findOne).toHaveBeenCalled();
      expect(ApiInfoModel.create).toHaveBeenCalledWith({
        _id: 'app_id',
        apiId: expect.any(String),
        createdAt: expect.any(Date)
      });
    });

    it('should return cached apiId without database query if already set', async () => {
      // First call to set the apiId
      const existingApiId = 'cached-app-id';
      const mockApiInfo = {
        _id: 'app_id',
        apiId: existingApiId,
        createdAt: new Date()
      };

      // Mock the findOne method to return the existing app info
      (ApiInfoModel.findOne as jest.Mock).mockResolvedValueOnce(mockApiInfo);

      // First call to get the apiId (this will cache it)
      const firstApiId = await databaseService.getOrCreateApiId();
      expect(firstApiId).toBe(existingApiId);
      expect(ApiInfoModel.findOne).toHaveBeenCalledTimes(1);

      // Clear the mocks to verify they aren't called again
      jest.clearAllMocks();

      // Second call should use the cached value
      const secondApiId = await databaseService.getOrCreateApiId();
      expect(secondApiId).toBe(existingApiId);

      // Verify that no database calls were made
      expect(ApiInfoModel.findOne).not.toHaveBeenCalled();
      expect(ApiInfoModel.create).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      // Mock a database error
      (ApiInfoModel.findOne as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      // Expect an error when trying to access the database
      await expect(databaseService.getOrCreateApiId()).rejects.toThrow('Database error');
    });
  });

  describe('close', () => {
    beforeEach(async () => {
      // Reset mocks before each test
      jest.clearAllMocks();
      // Reset the mongoose.connect mock to its default behavior
      (mongoose.connect as jest.Mock).mockResolvedValue(undefined);
      // Set connection state to connected
      (mongoose as any).__setConnectionState(1);
      await databaseService.connect();
    });

    afterEach(() => {
      // Reset the mongoose.connect mock to its default behavior
      (mongoose.connect as jest.Mock).mockResolvedValue(undefined);
    });

    it('should close Mongoose connection', async () => {
      // Set up the mock to update connection state when close is called
      (mongoose.connection.close as jest.Mock).mockImplementationOnce(() => {
        (mongoose as any).__setConnectionState(0);
        return Promise.resolve();
      });

      await databaseService.close();

      // Verify close was called
      expect(mongoose.connection.close).toHaveBeenCalled();
      expect(mongoose.connection.readyState).toBe(0); // 0 means disconnected
    });

    it('should handle close errors', async () => {
      // Mock the close method to throw an error
      (mongoose.connection.close as jest.Mock).mockRejectedValueOnce(new Error('Close error'));

      // Should not throw when trying to close an already closed connection
      await expect(databaseService.close()).resolves.not.toThrow();

      // Verify close was called despite the error
      expect(mongoose.connection.close).toHaveBeenCalled();
    });

    it('should log error when close fails', async () => {
      // Import logger and create a spy on its error method
      const logger = require('../src/utils/logger').default;
      const errorSpy = jest.spyOn(logger, 'error').mockImplementation();

      // Mock the close method to throw a specific error
      const mockError = new Error('Specific close error');
      (mongoose.connection.close as jest.Mock).mockRejectedValueOnce(mockError);

      // Close the connection (should not throw)
      await databaseService.close();

      // Verify error was logged
      expect(errorSpy).toHaveBeenCalledWith('Error closing MongoDB connection:', mockError);

      // Clean up
      errorSpy.mockRestore();
    });
  });
});
