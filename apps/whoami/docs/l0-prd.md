# Whoami Service - Problem Requirement Description (PRD)

## PRD-1: Overview
The Whoami service is a diagnostic web application that provides information about the server environment and incoming HTTP requests. It serves as a utility for debugging network configurations, inspecting HTTP headers, and verifying server identity.

## PRD-2: Problem Statement
When deploying web applications in complex network environments (such as containerized deployments, load balancers, or reverse proxies), it can be difficult to:
- Identify which server instance is handling a request
- Determine the client's perceived IP address
- Inspect HTTP headers that may be modified by intermediate network components
- Maintain a consistent identifier for a service instance across restarts

## PRD-3: User Requirements

### PRD-3.1: Server Information
Users need to view basic information about the server handling their request, including:
- Hostname of the server
- IP addresses of the server
- A persistent unique identifier for the application instance

### PRD-3.2: Instance Identification
The service must support unique identification of each application instance when multiple instances are deployed:
- Each instance must have a configurable instance key
- The instance key should be configurable via an environment variable
- If no environment variable is provided, the hostname should be used as the instance key
- The instance key must be used as the unique identifier in the database

### PRD-3.3: Request Information
Users need to inspect details about their HTTP request, including:
- Client IP address (including X-Forwarded-For handling)
- All HTTP headers sent with the request
- Request method, URL, and HTTP version

### PRD-3.3: Response Format
Users need to receive the information in a format appropriate to their client:
- JSON format for programmatic access
- Plain text format for basic human readability
- HTML format for enhanced visual presentation in browsers

## PRD-4: Non-functional Requirements

### PRD-4.1: Persistence
The service must maintain a consistent unique identifier (API ID) across application restarts.

### PRD-4.2: Logging
The service must provide comprehensive logging for operational monitoring and debugging.

### PRD-4.3: Error Handling
The service must gracefully handle errors and provide appropriate error responses.

### PRD-4.4: Availability
The service must implement connection retry mechanisms to ensure database availability.

## PRD-5: Constraints
- The service must be implemented as a Node.js application using Express
- The service must use MongoDB for persistence when MongoDB credentials are available
- The service must use file-based storage for persistence when MongoDB credentials are not available
- The service must be containerizable for deployment in orchestrated environments

### PRD-5.1: File-based Storage
When MongoDB credentials are not available (MONGO_WEB_PASSWORD is not set), the service must:
- Store persistence data in files instead of MongoDB
- Use the instance key as the filename for stored data
- Store files in a configurable data folder (specified by DATA_FOLDER environment variable)
- Default to /var/data if DATA_FOLDER is not specified
