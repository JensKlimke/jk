import fs from 'fs';
import path from 'path';
import logger from '../../src/utils/logger';

// Helper function to wait for a specified time
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Logger', () => {
  const logsDir = path.join(process.cwd(), 'logs');
  const logFilePath = path.join(logsDir, 'test.log');

  beforeAll(() => {
    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  });

  beforeEach(() => {
    // Clear the log file before each test
    if (fs.existsSync(logFilePath)) {
      fs.writeFileSync(logFilePath, '');
    } else {
      // Create an empty file if it doesn't exist
      fs.writeFileSync(logFilePath, '');
    }
  });

  afterAll(() => {
    // Clean up the log file after all tests
    if (fs.existsSync(logFilePath)) {
      fs.unlinkSync(logFilePath);
    }
  });

  it('should write logs to a file in test environment', async () => {
    // Log some messages
    logger.info('Test info message');
    logger.warn('Test warning message');
    logger.error('Test error message');

    // Wait for logs to be written (Winston file transport is asynchronous)
    await wait(500);

    // Check if the log file exists
    expect(fs.existsSync(logFilePath)).toBe(true);

    // Read the log file content
    const logContent = fs.readFileSync(logFilePath, 'utf8');

    // Verify that the log messages are in the file
    expect(logContent).toContain('info: Test info message');
    expect(logContent).toContain('warn: Test warning message');
    expect(logContent).toContain('error: Test error message');
  });

  it('should log errors with stack traces', async () => {
    // Create an error with a stack trace
    const error = new Error('Test error with stack');

    // Log the error
    logger.error('Error occurred', error);

    // Wait for logs to be written
    await wait(500);

    // Read the log file content
    const logContent = fs.readFileSync(logFilePath, 'utf8');

    // Verify that the error message is in the file
    expect(logContent).toContain('error: Error occurred');
  });
});
