# Linting and Formatting

This guide explains how to use the linting and formatting tools in the JK project to maintain code quality and consistency.

## Overview

The JK project uses the following tools for code quality and formatting:

- **ESLint**: For static code analysis and enforcing coding standards
- **Prettier**: For automatic code formatting

These tools are configured at the root level and applied consistently across all packages in the monorepo.

## ESLint Configuration

ESLint is configured in the `.eslintrc.js` file at the root of the project. The configuration:

- Uses the TypeScript parser
- Extends recommended configurations for TypeScript, React, and other plugins
- Includes custom rules specific to the project

Each package may have its own `.eslintrc.js` file that extends the root configuration and adds package-specific rules.

## Prettier Configuration

Prettier is configured in the `.prettierrc.js` file at the root of the project. This ensures consistent formatting across all packages.

## Ignored Files

Files that should be ignored by ESLint and Prettier are specified in:

- `.eslintignore`: For files to be ignored by ESLint
- `.prettierignore`: For files to be ignored by Prettier

Typically, these include build artifacts, node_modules, and other generated files.

## Running Linting

### Linting All Packages

To run ESLint on all packages:

```bash
npm run lint
```

This command executes the `lint` script in each package's `package.json`.

### Linting with Auto-Fix

To automatically fix linting issues where possible:

```bash
npm run lint:fix
```

### Linting a Specific Package

To lint a specific package:

```bash
npm run lint --workspace=@jk/models
```

Replace `@jk/models` with the name of the package you want to lint.

## Running Formatting

### Formatting All Packages

To format all files in all packages:

```bash
npm run format
```

This command executes the `format` script in each package's `package.json`.

### Checking Formatting

To check if files are properly formatted without making changes:

```bash
npm run format:check
```

### Formatting a Specific Package

To format a specific package:

```bash
npm run format --workspace=@jk/api
```

Replace `@jk/api` with the name of the package you want to format.

## Combined Linting and Formatting

To run both linting and formatting in a single command:

```bash
npm run lint-format
```

## Pre-Commit Hooks

The project uses Husky and lint-staged to run linting and formatting on staged files before each commit. This ensures that all committed code meets the project's quality standards.

## VS Code Integration

For VS Code users, it's recommended to install the ESLint and Prettier extensions and configure them to:

- Format on save
- Fix ESLint issues on save

This provides real-time feedback and automatic fixing of issues as you write code.

### Recommended VS Code Settings

Add the following to your VS Code settings:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "prettier.requireConfig": true
}
```

## Troubleshooting

### Conflicting Rules

If you encounter conflicts between ESLint and Prettier rules, the project is configured to give Prettier precedence. This is achieved through the `eslint-config-prettier` package, which disables ESLint rules that might conflict with Prettier.

### Fixing Linting Errors

If you encounter linting errors that you're not sure how to fix, try:

1. Running `npm run lint:fix` to see if the issue can be automatically fixed
2. Checking the ESLint documentation for the specific rule that's failing
3. Looking at other code in the project for examples of how to comply with the rule

### Disabling Rules

In rare cases where a rule doesn't make sense for a specific piece of code, you can disable it:

```typescript
// eslint-disable-next-line some-rule
const someCode = 'that would normally trigger the rule';

/* eslint-disable some-other-rule */
// Multiple lines where the rule is disabled
/* eslint-enable some-other-rule */
```

However, it's generally better to fix the issue rather than disabling the rule.