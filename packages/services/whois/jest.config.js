/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // Extend the root configuration
  ...require('../../../jest.config'),
  // Override settings specific to the WHOIS package
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  // Module name mapper for resolving @jk/api-server
  moduleNameMapper: {
    '^@jk/api-server$': '<rootDir>/../../libs/api-server/dist'
  },
  // Configure ts-jest
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  }
};
