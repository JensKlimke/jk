# Whoami Service - Technical Architecture

## ARCH-1: System Overview
The Whoami service is a Node.js web application built with Express that provides server and request information. It uses MongoDB for persistence and Winston for logging.

## ARCH-2: Component Architecture

### ARCH-2.1: Core Components
The system consists of the following core components:

| Component ID | Component Name | Description | References |
|--------------|----------------|-------------|------------|
| COMP-1 | Express Application | The main web server handling HTTP requests | PRD-3.2, PRD-3.3 |
| COMP-2 | Database Service | Manages MongoDB connections and API ID persistence | PRD-4.1, PRD-4.4 |
| COMP-3 | Whoami Service | Provides server and request information | PRD-3.1, PRD-3.2 |
| COMP-4 | Router | Defines API endpoints and routes requests to controllers | PRD-3.3 |
| COMP-5 | Logger | Provides structured logging capabilities | PRD-4.2 |
| COMP-6 | Data Models | Defines database schemas | PRD-4.1 |
| COMP-7 | Template Renderer | Renders HTML templates for browser display | PRD-3.3 |
| COMP-8 | Whoami Controller | Handles HTTP requests, content negotiation, and coordinates services | PRD-3.2, PRD-3.3 |

### ARCH-2.2: Component Interactions
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Router    │────▶│   Whoami    │────▶│   Whoami    │
│             │◀────│  (COMP-4)   │◀────│ Controller  │◀────│  Service    │
└─────────────┘     └─────────────┘     │  (COMP-8)   │     │  (COMP-3)   │
                                        └─────────────┘     └─────────────┘
                                              │
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Logger    │◀────│   Express   │     │  Template   │
│  (COMP-5)   │     │ Application │◀────│  Renderer   │
└─────────────┘     │  (COMP-1)   │     │  (COMP-7)   │
                    └─────────────┘     └─────────────┘
                          │                    ▲
                          │                    │
                          ▼                    │
                    ┌─────────────┐            │
                    │  Database   │            │
                    │   Service   │            │
                    │  (COMP-2)   │            │
                    └─────────────┘            │
                          │                    │
                          ▼                    │
                    ┌─────────────┐            │
                    │  MongoDB    │            │
                    │  Database   │            │
                    └─────────────┘            │
                                               │
                                               │
                    ┌─────────────┐            │
                    │ Data Models │────────────┘
                    │  (COMP-6)   │
                    └─────────────┘
```

## ARCH-3: Technical Decisions

### ARCH-3.1: Architectural Pattern
The application follows the Model-View-Controller (MVC) pattern:
- **Model**: Represented by the Whoami Service (COMP-3) and Database Service (COMP-2), which handle business logic and data access
- **View**: Implemented by the Template Renderer (COMP-7), which generates HTML responses
- **Controller**: Implemented by the Whoami Controller (COMP-8), which processes HTTP requests, coordinates services, and formats responses

This separation of concerns improves maintainability, testability, and allows for clearer code organization.

### ARCH-3.2: Technology Stack
| Technology | Purpose | Justification |
|------------|---------|---------------|
| Node.js | Runtime environment | Lightweight, event-driven architecture suitable for microservices |
| Express | Web framework | Minimalist, flexible framework for HTTP server applications |
| MongoDB | Database | Document-oriented database for simple persistence needs |
| Mongoose | ODM | Object Data Modeling library for MongoDB and Node.js |
| Winston | Logging | Flexible logging library with multiple transport options |
| TypeScript | Programming language | Adds static typing to JavaScript for improved code quality |
| Mustache | Templating engine | Logic-less templates for HTML rendering with simple syntax |

### ARCH-3.2: Data Storage
The application uses MongoDB to store a single document containing the API ID, which persists across application restarts.

### ARCH-3.3: Error Handling
The application implements centralized error handling in the controller component, with appropriate error responses based on the client's Accept header and User-Agent.

### ARCH-3.4: Logging Strategy
The application uses Winston for structured logging with configurable output destinations (console, file, or both) and log levels based on the environment.

## ARCH-4: Deployment Architecture

### ARCH-4.1: Containerization
The application is designed to be containerized using Docker, allowing for deployment in various orchestrated environments.

### ARCH-4.2: Database Connection
The application connects to MongoDB using environment variables for configuration, with a retry mechanism to handle temporary connection failures.

### ARCH-4.3: Configuration
The application is configured using environment variables:
- PORT: The port on which the server listens
- HOSTNAME: The hostname of the server
- MONGO_WEB_USER: MongoDB username
- MONGO_WEB_PASSWORD: MongoDB password
- MONGO_UPSTREAM_URL: MongoDB connection URL
- LOG_LEVEL: Logging verbosity level
- LOG_OUTPUT: Logging output destination (console, file, or both)
- NODE_ENV: Environment type (production, development)
