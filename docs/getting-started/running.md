# Running the Applications

This guide explains how to run the applications in the JK project.

## Overview

The JK project supports multiple types of applications that can be run in development or production mode:

- **Backend Services**: Services that provide APIs or other functionality
- **Frontend Applications**: Web applications that consume backend services

The current example components demonstrate this architecture.

## Development Mode

Development mode provides hot-reloading and other features that make development easier.

### Running a Backend Service

To start a backend service in development mode:

```bash
npm run dev --workspace=@jk/[service-name]
```

Example:
```bash
npm run dev --workspace=@jk/api
```

Backend services typically run on ports in the 3000-3999 range.

### Running a Frontend Application

To start a frontend application in development mode:

```bash
npm run dev --workspace=@jk/[app-name]
```

Example:
```bash
npm run dev --workspace=@jk/app
```

Frontend applications in development mode typically run on port 5173 (the default Vite development server port).

## Production Mode

Before running the applications in production mode, you need to build them first:

```bash
npm run build
```

### Running a Backend Service

To start a backend service in production mode:

```bash
npm run start --workspace=@jk/[service-name]
```

Example:
```bash
npm run start --workspace=@jk/api
```

### Running a Frontend Application

To start a frontend application in production mode:

```bash
npm run start --workspace=@jk/[app-name]
```

Example:
```bash
npm run start --workspace=@jk/app
```

## Running with Docker

For a more production-like environment, you can run all services using Docker Compose. See the [Docker documentation](../docker/usage.md) for details.

## Accessing the Applications

Once the applications are running, you can access them at their respective URLs, which are typically displayed in the console output when starting the application.

In the example components:
- Frontend Application: http://localhost:3000 (production) or http://localhost:5173 (development)
- API Service: http://localhost:3001

## Stopping the Applications

To stop a running application, press `Ctrl+C` in the terminal where it's running.

## Troubleshooting

If you encounter issues running the applications:

1. Make sure all dependencies are installed: `npm install`
2. Make sure all packages are built: `npm run build`
3. Check that the ports are not already in use by other applications
4. Check the console output for error messages
