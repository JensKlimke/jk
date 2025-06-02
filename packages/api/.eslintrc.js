module.exports = {
  extends: ['../../.eslintrc.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // Add any API-specific rules here
    'no-console': ['warn', { allow: ['error', 'warn', 'info'] }], // Allow some console methods for server logging
  },
};