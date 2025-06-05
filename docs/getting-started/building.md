# Building the Packages

This guide explains how to build the packages in the JK project.

## Overview

The JK project is a monorepo containing multiple packages that need to be built in a specific order due to dependencies between them. The build process is managed through npm scripts defined in the root `package.json`.

## Build Order

Packages are built in a specific order to ensure that dependencies are built before the packages that depend on them. The current example packages are built in this order:

1. Shared libraries (e.g., `@jk/models`, `@jk/api-server`)
2. Services (e.g., `@jk/api`)
3. Applications (e.g., `@jk/app`)

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
# Build a library package
npm run build --workspace=@jk/[library-name]

# Build a service
npm run build --workspace=@jk/[service-name]

# Build an application
npm run build --workspace=@jk/[app-name]
```

Note that when building individual packages, you need to ensure that their dependencies have been built first. For example, before building a service that depends on shared libraries:

```bash
npm run build --workspace=@jk/[library-name]
npm run build --workspace=@jk/[service-name]
```

## Convenience Scripts

The root `package.json` may include convenience scripts for building common dependencies:

```bash
# Example: Build just the models package
npm run build:models

# Example: Build just the API server library
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
