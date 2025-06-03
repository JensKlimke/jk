# Adding New Packages

This guide explains how to add new packages to the JK project monorepo.

## Overview

The JK project is organized as a monorepo using npm workspaces. This allows for easy sharing of code between packages and simplified dependency management. When adding a new package, you need to follow certain conventions to ensure it integrates properly with the rest of the project.

## Package Types

The monorepo is organized into different categories of packages:

- **Libraries** (`packages/libs/`): Shared code used by multiple packages
- **Web Applications** (`packages/apps/`): Frontend applications
- **Services** (`packages/services/`): Backend services and APIs

## Steps to Add a New Package

### 1. Determine the Package Type

First, determine what type of package you're creating:

- If it's shared code used by multiple packages, it should be a library
- If it's a frontend application, it should be a web application
- If it's a backend service or API, it should be a service

### 2. Create the Package Directory

Create a new directory in the appropriate category folder:

```bash
# For a library
mkdir -p packages/libs/your-package-name

# For a web application
mkdir -p packages/apps/your-package-name

# For a service
mkdir -p packages/services/your-package-name
```

### 3. Initialize the Package

Create a `package.json` file in the new directory:

```json
{
  "name": "@jk/your-package-name",
  "version": "1.0.0",
  "description": "Description of your package",
  "license": "MIT",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc --build",
    "clean": "rimraf dist",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\"",
    "test": "jest"
  },
  "dependencies": {
    // Add your dependencies here
  },
  "devDependencies": {
    // Add your dev dependencies here
  }
}
```

Adjust the scripts, dependencies, and other fields as needed for your specific package.

### 4. Create a TypeScript Configuration

Create a `tsconfig.json` file in the new directory:

```json
{
  "extends": "../../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

### 5. Create the Source Directory

Create a `src` directory and add an `index.ts` file:

```bash
mkdir -p packages/libs/your-package-name/src
touch packages/libs/your-package-name/src/index.ts
```

### 6. Add Package to Build Order (if necessary)

If your package needs to be built in a specific order (e.g., if other packages depend on it), add it to the `buildOrder` array in the `build.js` file at the root of the project.

### 7. Install Dependencies

Run the following command to install dependencies for your new package:

```bash
npm install
```

This will update the root `package-lock.json` and set up the necessary symlinks.

### 8. Build the Package

Build your new package:

```bash
npm run build --workspace=@jk/your-package-name
```

## Example: Adding a New Library

Here's an example of adding a new library called "utils":

```bash
# Create the directory
mkdir -p packages/libs/utils

# Create package.json
cat > packages/libs/utils/package.json << EOF
{
  "name": "@jk/utils",
  "version": "1.0.0",
  "description": "Utility functions for JK project",
  "license": "MIT",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc --build",
    "clean": "rimraf dist",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "format:check": "prettier --check \"src/**/*.ts\"",
    "test": "jest"
  },
  "dependencies": {},
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "jest": "^29.7.0",
    "rimraf": "^5.0.5",
    "ts-jest": "^29.1.2",
    "typescript": "~5.0.4"
  }
}
EOF

# Create tsconfig.json
cat > packages/libs/utils/tsconfig.json << EOF
{
  "extends": "../../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
EOF

# Create src directory and index.ts
mkdir -p packages/libs/utils/src
cat > packages/libs/utils/src/index.ts << EOF
/**
 * Utility functions for JK project
 */

/**
 * Formats a date as a string
 * @param date The date to format
 * @returns The formatted date string
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
EOF

# Install dependencies
npm install

# Build the package
npm run build --workspace=@jk/utils
```

## Best Practices

- Follow the naming convention `@jk/package-name` for all packages
- Include appropriate scripts in `package.json` for building, testing, linting, etc.
- Use TypeScript for all packages
- Add tests for all packages
- Document your package's API and usage