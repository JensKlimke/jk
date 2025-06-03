# Building the Packages

This guide explains how to build the packages in the JK project.

## Overview

The JK project is a monorepo containing multiple packages that need to be built in a specific order due to dependencies between them. The build process is managed through npm scripts defined in the root `package.json`.

## Build Order

The packages are built in the following order:

1. `@jk/models` - Shared data models
2. `@jk/api-server` - API server library
3. `@jk/api` - API service
4. `@jk/whois` - WHOIS service
5. `@jk/app` - Frontend application

This order ensures that dependencies are built before the packages that depend on them.

## Building All Packages

To build all packages in the correct order, run:

```bash
npm run build
```

This command uses the `build.js` script at the root of the project to build each package in the correct order.

## Building Individual Packages

You can also build individual packages:

```bash
# Build the models package
npm run build --workspace=@jk/models

# Build the API server library
npm run build --workspace=@jk/api-server

# Build the API service
npm run build --workspace=@jk/api

# Build the WHOIS service
npm run build --workspace=@jk/whois

# Build the frontend application
npm run build --workspace=@jk/app
```

Note that when building individual packages, you need to ensure that their dependencies have been built first. For example, before building the API service, you should build the models and API server packages:

```bash
npm run build --workspace=@jk/models
npm run build --workspace=@jk/api-server
npm run build --workspace=@jk/api
```

## Convenience Scripts

The root `package.json` includes convenience scripts for building common dependencies:

```bash
# Build just the models package
npm run build:models

# Build just the API server library
npm run build:api-server
```

These scripts are useful when you need to rebuild just these packages after making changes to them.

## Clean Build

If you encounter issues with the build process, you can perform a clean build by first removing all build artifacts and node_modules, then reinstalling dependencies and rebuilding:

```bash
npm run clean
npm run build
```

The `clean` script removes all `node_modules` directories and `package-lock.json` files, then reinstalls all dependencies.

## Next Steps

After building the packages, you can:

- [Run the applications](running.md)