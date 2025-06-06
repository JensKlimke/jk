/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Extend the root configuration
  ...require('../../../jest.config'),
  // Override settings specific to the Models package
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
};
