// Jest setup file for global test configuration

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

// Global test timeout
jest.setTimeout(10000);
