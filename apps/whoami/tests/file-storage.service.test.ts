import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileStorageService } from '../src/services/file-storage.service';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));

// Mock path module
jest.mock('path', () => ({
  join: jest.fn((a, b) => `${a}/${b}`),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
}));

// Mock logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock os module
jest.mock('os', () => ({
  hostname: jest.fn().mockReturnValue('test-hostname'),
}));

describe('FileStorageService', () => {
  let fileStorageService: FileStorageService;
  const testDataFolder = './test-data';
  const testInstanceKey = 'test-instance';
  const testFilePath = `${testDataFolder}/${testInstanceKey}`;

  // Save original process.env
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set test environment variables
    process.env = { ...originalEnv, NODE_ENV: 'test' };

    // Set up the mocks
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (path.join as jest.Mock).mockReturnValue(testFilePath);

    // Create a new instance of FileStorageService
    fileStorageService = new FileStorageService();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should use DATA_FOLDER environment variable when set', () => {
      // Set up env var
      const customDataFolder = '/custom/data';
      process.env = { ...originalEnv, NODE_ENV: 'test', DATA_FOLDER: customDataFolder };

      // Reset path.join mock to test its arguments
      (path.join as jest.Mock).mockImplementation((a, b) => `${a}/${b}`);

      // Create new instance
      fileStorageService = new FileStorageService();

      // Verify path.join was called with custom data folder
      expect(path.join).toHaveBeenCalledWith(customDataFolder, expect.any(String));
    });

    it('should use INSTANCE_KEY environment variable when set', () => {
      // Set up env var
      process.env = { ...originalEnv, NODE_ENV: 'test', INSTANCE_KEY: testInstanceKey };

      // Reset path.join mock to test its arguments
      (path.join as jest.Mock).mockImplementation((a, b) => `${a}/${b}`);

      // Create new instance
      fileStorageService = new FileStorageService();

      // Verify path.join was called with the instance key
      expect(path.join).toHaveBeenCalledWith(expect.any(String), testInstanceKey);
    });

    it('should create data folder if it does not exist', () => {
      // Setup mock to indicate data folder does not exist
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Create new instance
      fileStorageService = new FileStorageService();

      // Verify mkdirSync was called to create the folder
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });

    it('should not create data folder if it already exists', () => {
      // Setup mock to indicate data folder exists
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Create new instance
      fileStorageService = new FileStorageService();

      // Verify mkdirSync was not called
      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should handle errors when creating data folder', () => {
      // Setup mock to indicate data folder does not exist
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Setup mock to throw error when creating folder
      const testError = new Error('Failed to create directory');
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {
        throw testError;
      });

      // Expect constructor to throw
      expect(() => {
        new FileStorageService();
      }).toThrow(testError);
    });
  });

  describe('connect', () => {
    it('should resolve immediately without doing anything', async () => {
      await expect(fileStorageService.connect()).resolves.toBeUndefined();
    });
  });

  describe('connectWithRetry', () => {
    it('should retry creating data folder on failure', async () => {
      // Setup mocks to fail once then succeed
      (fs.existsSync as jest.Mock)
        .mockReturnValueOnce(false)  // First check - folder doesn't exist
        .mockReturnValueOnce(false); // Second check - folder doesn't exist

      (fs.mkdirSync as jest.Mock)
        .mockImplementationOnce(() => { throw new Error('First failure'); })
        .mockImplementationOnce(() => undefined); // Second attempt succeeds

      // Mock setTimeout to execute immediately
      jest.useFakeTimers();
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });

      await expect(fileStorageService.connectWithRetry(2, 10)).resolves.toBeUndefined();

      // Verify mkdirSync was called twice
      expect(fs.mkdirSync).toHaveBeenCalledTimes(2);

      // Restore the original setTimeout
      jest.useRealTimers();
    });

    it('should throw after max retries', async () => {
      // Setup mocks to always fail
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      (fs.mkdirSync as jest.Mock).mockImplementation(() => {
        throw new Error('Persistent failure');
      });

      // Mock setTimeout to execute immediately
      jest.useFakeTimers();
      jest.spyOn(global, 'setTimeout').mockImplementation((callback: any) => {
        callback();
        return {} as any;
      });

      // Should throw after 2 retries
      await expect(fileStorageService.connectWithRetry(2, 10))
        .rejects.toThrow('Failed to initialize file storage after 2 attempts');

      // Verify mkdirSync was called 2 times
      expect(fs.mkdirSync).toHaveBeenCalledTimes(2);

      // Restore the original setTimeout
      jest.useRealTimers();
    });
  });

  describe('getOrCreateApiId', () => {
    it('should return cached apiId if available', async () => {
      // Set apiId directly (for testing only)
      (fileStorageService as any).apiId = 'cached-api-id';

      const apiId = await fileStorageService.getOrCreateApiId();

      // Should return the cached value
      expect(apiId).toBe('cached-api-id');

      // Should not try to read or write to file
      expect(fs.readFile).not.toHaveBeenCalled();
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should read apiId from file if it exists', async () => {
      // Mock readFile to return an existing apiId
      const existingApiId = 'existing-api-id';
      (fs.readFile as unknown as jest.Mock).mockImplementation((path, encoding, callback) => {
        callback(null, JSON.stringify({ apiId: existingApiId }));
      });

      const apiId = await fileStorageService.getOrCreateApiId();

      // Should return the value from the file
      expect(apiId).toBe(existingApiId);

      // Should have read from file but not written
      expect(fs.readFile).toHaveBeenCalled();
      expect(fs.writeFile).not.toHaveBeenCalled();

      // Cached value should be set
      expect((fileStorageService as any).apiId).toBe(existingApiId);
    });

    it('should create new apiId if file does not exist', async () => {
      // Mock readFile to simulate file not found
      (fs.readFile as unknown as jest.Mock).mockImplementation((path, encoding, callback) => {
        const error: NodeJS.ErrnoException = new Error('File not found');
        error.code = 'ENOENT';
        callback(error, null);
      });

      // Mock writeFile to succeed
      (fs.writeFile as unknown as jest.Mock).mockImplementation((path, data, encoding, callback) => {
        callback(null);
      });

      const apiId = await fileStorageService.getOrCreateApiId();

      // Should return a new UUID
      expect(apiId).toBe('mock-uuid');
      expect(uuidv4).toHaveBeenCalled();

      // Should have read and written to file
      expect(fs.readFile).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalled();

      // Verify write data contains the new apiId
      const writeData = (fs.writeFile as unknown as jest.Mock).mock.calls[0][1];
      expect(JSON.parse(writeData).apiId).toBe('mock-uuid');

      // Cached value should be set
      expect((fileStorageService as any).apiId).toBe('mock-uuid');
    });

    it('should handle JSON parse errors when reading file', async () => {
      // Mock readFile to return invalid JSON
      (fs.readFile as unknown as jest.Mock).mockImplementation((path, encoding, callback) => {
        callback(null, 'invalid-json');
      });

      await expect(fileStorageService.getOrCreateApiId()).rejects.toThrow();

      // Should have attempted to read the file
      expect(fs.readFile).toHaveBeenCalled();
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should handle write errors', async () => {
      // Mock readFile to simulate file not found
      (fs.readFile as unknown as jest.Mock).mockImplementation((path, encoding, callback) => {
        const error: NodeJS.ErrnoException = new Error('File not found');
        error.code = 'ENOENT';
        callback(error, null);
      });

      // Mock writeFile to fail
      const writeError = new Error('Write error');
      (fs.writeFile as unknown as jest.Mock).mockImplementation((path, data, encoding, callback) => {
        callback(writeError);
      });

      await expect(fileStorageService.getOrCreateApiId()).rejects.toThrow(writeError);

      // Should have attempted to read and write
      expect(fs.readFile).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('should resolve immediately without doing anything', async () => {
      await expect(fileStorageService.close()).resolves.toBeUndefined();
    });
  });
});
