# Running the Applications

This guide explains how to run the applications in the JK project.

## Overview

The JK project consists of multiple applications that can be run in development or production mode:

- **API Service**: An Express.js backend service
- **WHOIS Service**: A service providing WHOIS information
- **Frontend Application**: A React application that consumes the API services

## Development Mode

Development mode provides hot-reloading and other features that make development easier.

### Running the API Service

To start the API service in development mode:

```bash
npm run dev --workspace=@jk/api
```

The API service will be available at http://localhost:3001.

### Running the WHOIS Service

To start the WHOIS service in development mode:

```bash
npm run dev --workspace=@jk/whois
```

The WHOIS service will be available at http://localhost:3002.

### Running the Frontend Application

To start the frontend application in development mode:

```bash
npm run dev --workspace=@jk/app
```

The frontend application will be available at http://localhost:5173 (the default Vite development server port).

## Production Mode

Before running the applications in production mode, you need to build them first:

```bash
npm run build
```

### Running the API Service

To start the API service in production mode:

```bash
npm run start --workspace=@jk/api
```

The API service will be available at http://localhost:3001.

### Running the WHOIS Service

To start the WHOIS service in production mode:

```bash
npm run start --workspace=@jk/whois
```

The WHOIS service will be available at http://localhost:3002.

### Running the Frontend Application

To start the frontend application in production mode:

```bash
npm run start --workspace=@jk/app
```

The frontend application will be available at http://localhost:3000.

## Running with Docker

For a more production-like environment, you can run all services using Docker Compose. See the [Docker documentation](../docker/usage.md) for details.

## Accessing the Applications

Once the applications are running, you can access them at:

- Frontend Application: http://localhost:3000 (production) or http://localhost:5173 (development)
- API Service: http://localhost:3001
- WHOIS Service: http://localhost:3002

The frontend application will automatically connect to the API and WHOIS services if they are running.

## Stopping the Applications

To stop a running application, press `Ctrl+C` in the terminal where it's running.

## Troubleshooting

If you encounter issues running the applications:

1. Make sure all dependencies are installed: `npm install`
2. Make sure all packages are built: `npm run build`
3. Check that the ports are not already in use by other applications
4. Check the console output for error messages