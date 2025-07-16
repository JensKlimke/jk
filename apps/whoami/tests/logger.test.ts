import fs from 'fs';

// Mock fs module
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  stat: jest.fn((path, callback) => callback(null, { isDirectory: () => true })),
  createWriteStream: jest.fn(() => ({
    on: jest.fn(),
    end: jest.fn()
  })),
  promises: {
    readFile: jest.fn()
  }
}));

// We need to mock fs before importing logger
describe('Logger', () => {
  beforeEach(() => {
    // Clear all mocks and environment variables before each test
    jest.clearAllMocks();

    // Set environment to avoid file transport issues
    process.env.LOG_OUTPUT = 'console';
    delete process.env.LOG_LEVEL;
    delete process.env.NODE_ENV;
  });

  it('should create logs directory if it does not exist', () => {
    // Mock fs.existsSync to return false (directory doesn't exist)
    (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

    // Import logger to trigger the directory creation code
    jest.isolateModules(() => {
      require('../src/utils/logger');
    });

    // Verify that mkdirSync was called with the correct parameters
    expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('logs'));
    expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('logs'), { recursive: true });
  });

  it('should not create logs directory if it already exists', () => {
    // Mock fs.existsSync to return true (directory exists)
    (fs.existsSync as jest.Mock).mockReturnValueOnce(true);

    // Import logger to trigger the directory creation code
    jest.isolateModules(() => {
      require('../src/utils/logger');
    });

    // Verify that mkdirSync was not called
    expect(fs.existsSync).toHaveBeenCalledWith(expect.stringContaining('logs'));
    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });
});
