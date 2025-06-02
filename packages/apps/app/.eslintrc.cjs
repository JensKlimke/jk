module.exports = {
  extends: ['../../../.eslintrc.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    // Add any React-specific rules here
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react/jsx-filename-extension': [1, { extensions: ['.tsx'] }], // Allow JSX in .tsx files
    'react/jsx-props-no-spreading': 'off', // Allow JSX props spreading
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
