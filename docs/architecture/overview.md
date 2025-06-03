# System Architecture Overview

This document provides an overview of the JK project's architecture.

## Overview

The JK project follows a modular architecture with clear separation of concerns. The system is organized as a monorepo containing multiple packages that work together to provide a complete application.

## High-Level Architecture

The system consists of three main components:

1. **Frontend Application**: A React-based web application that provides the user interface
2. **API Service**: An Express.js backend service that provides data to the frontend
3. **WHOIS Service**: A specialized service for providing WHOIS information

These components communicate with each other through HTTP APIs, with the frontend application consuming the APIs provided by the backend services.

## Component Diagram

```
┌─────────────────┐     HTTP     ┌─────────────────┐
│                 │───────────────▶                │
│  Frontend App   │              │    API Service  │
│  (React + Vite) │◀───────────────                │
│                 │     JSON     │   (Express.js)  │
└─────────────────┘              └─────────────────┘
         │                               │
         │                               │
         │ HTTP                          │ Internal
         │                               │ Communication
         │                               │
         ▼                               ▼
┌─────────────────┐              ┌─────────────────┐
│                 │              │                 │
│  WHOIS Service  │              │  Shared Models  │
│   (Express.js)  │              │  (TypeScript)   │
│                 │              │                 │
└─────────────────┘              └─────────────────┘
```

## Package Structure

The monorepo is organized into different categories of packages:

### Libraries (`packages/libs/`)

Shared code used by multiple packages:

- **models**: Shared data models and interfaces
- **api-server**: Common API server functionality

### Web Applications (`packages/apps/`)

Frontend applications:

- **app**: React frontend application

### Services (`packages/services/`)

Backend services and APIs:

- **api**: Express API backend
- **whois**: WHOIS service

## Data Flow

1. The frontend application makes HTTP requests to the API and WHOIS services
2. The services process these requests and return JSON responses
3. The frontend application renders the data for the user

## Key Technologies

- **TypeScript**: Used throughout the project for type safety
- **React**: Used for the frontend application
- **Express.js**: Used for the backend services
- **Vite**: Used for building the frontend application
- **Jest**: Used for testing
- **Docker**: Used for containerization
- **Nginx**: Used as a reverse proxy

## Code Sharing

The project uses a monorepo structure to facilitate code sharing between packages:

- The `models` package defines shared data structures used by both the frontend and backend
- The `api-server` package provides common functionality for creating API servers

## Deployment Architecture

When deployed using Docker, the system uses the following architecture:

```
                   ┌─────────────────┐
                   │                 │
                   │  Nginx Reverse  │
                   │     Proxy       │
                   │                 │
                   └─────────────────┘
                           │
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│                 │ │                 │ │                 │
│  Frontend App   │ │   API Service   │ │  WHOIS Service  │
│    Container    │ │    Container    │ │    Container    │
│                 │ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

The Nginx reverse proxy routes requests to the appropriate service based on the subdomain:
- `app.${DOMAIN}` routes to the frontend app
- `api.${DOMAIN}` routes to the API service
- `whois.${DOMAIN}` routes to the WHOIS service

## Security Considerations

- The API and WHOIS services use Helmet to add security headers
- CORS is enabled to allow the frontend to communicate with the backend services
- The services are isolated in separate containers

## Scalability

The architecture supports horizontal scaling:
- Each service can be scaled independently
- The Nginx reverse proxy can distribute load across multiple instances of each service
- The stateless nature of the services makes them easy to scale

## Future Enhancements

Potential enhancements to the architecture could include:

- Adding a database for persistent storage
- Implementing authentication and authorization
- Adding a message queue for asynchronous processing
- Implementing a microservices architecture with more specialized services
- Adding a service mesh for more complex service-to-service communication

## Next Steps

- Learn about [Docker setup and usage](../docker/setup.md)
- Return to the [main documentation](../README.md)