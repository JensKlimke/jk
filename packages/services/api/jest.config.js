/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Extend the root configuration
  ...require('../../../jest.config'),
  // Override settings specific to the API package
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  // Module name mapper for resolving @jk/models
  moduleNameMapper: {
    '^@jk/models$': '<rootDir>/../../libs/models/dist'
  }
};
