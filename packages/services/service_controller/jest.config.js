/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Extend the root configuration
  ...require('../../../jest.config'),
  // Override settings specific to the service_controller package
  testEnvironment: 'node',
  // Override testMatch to include tests in the tests directory
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx', '**/tests/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  // Configure ts-jest
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  }
};
