# Docker Setup

This guide explains the Docker setup for the JK project.

## Overview

The JK project includes Docker support for all services and applications, making it easy to build and run the entire system in containers. Each package has its own Dockerfile, and a `docker-compose.yml` file is provided at the root of the project to orchestrate all services.

## Dockerfiles

### Frontend App Dockerfile

The frontend app Dockerfile (`packages/apps/app/Dockerfile`) is a multi-stage build:

1. **Build Stage**:
   - Uses Node.js 18 Alpine as the base image
   - Copies package.json files and installs dependencies
   - Copies source code and builds the application
   - Accepts build arguments for API and WHOIS service URLs

2. **Production Stage**:
   - Uses Nginx Alpine as the base image
   - Copies the built files from the build stage to the Nginx web root
   - Exposes port 80

```dockerfile
FROM node:18-alpine AS builder

# Define build arguments for service URLs
ARG API_URL
ARG WHOIS_URL

WORKDIR /app

# Copy package.json files
COPY package.json package-lock.json ./
COPY packages/libs/models/package.json ./packages/libs/models/
COPY packages/apps/app/package.json ./packages/apps/app/

# Copy tsconfig files
COPY tsconfig.json ./
COPY packages/libs/models/tsconfig.json ./packages/libs/models/
COPY packages/apps/app/tsconfig.json ./packages/apps/app/

# Install dependencies
RUN npm install

# Copy source code
COPY packages/libs/models ./packages/libs/models/
COPY packages/apps/app ./packages/apps/app/

# Build models first, then app
RUN npm run build:models
# Pass environment variables to the build process
RUN VITE_API_URL=$API_URL VITE_WHOIS_URL=$WHOIS_URL npm run build --workspace=@jk/app

# Production stage
FROM nginx:alpine

# Copy built files from builder stage to nginx
COPY --from=builder /app/packages/apps/app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### API Service Dockerfile

The API service Dockerfile (`packages/services/api/Dockerfile`):

- Uses Node.js 18 Alpine as the base image
- Copies package.json files and installs dependencies
- Copies source code and builds the application
- Exposes port 3001
- Starts the API server

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package.json files
COPY package.json package-lock.json ./
COPY packages/libs/models/package.json ./packages/libs/models/
COPY packages/libs/api-server/package.json ./packages/libs/api-server/
COPY packages/services/api/package.json ./packages/services/api/

# Copy tsconfig files
COPY tsconfig.json ./
COPY packages/libs/models/tsconfig.json ./packages/libs/models/
COPY packages/libs/api-server/tsconfig.json ./packages/libs/api-server/
COPY packages/services/api/tsconfig.json ./packages/services/api/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/libs/models ./packages/libs/models/
COPY packages/libs/api-server ./packages/libs/api-server/
COPY packages/services/api ./packages/services/api/

# Build packages in order
RUN npm run build:models
RUN npm run build:api-server
RUN npm run build --workspace=@jk/api

# Expose the API port
EXPOSE 3001

# Start the API server
CMD ["node", "packages/services/api/dist/index.js"]
```

### WHOIS Service Dockerfile

The WHOIS service Dockerfile (`packages/services/whois/Dockerfile`):

- Uses Node.js 18 Alpine as the base image
- Copies package.json files and installs dependencies
- Copies source code and builds the application
- Exposes port 3002
- Starts the WHOIS server

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package.json files
COPY package.json package-lock.json ./
COPY packages/libs/api-server/package.json ./packages/libs/api-server/
COPY packages/services/whois/package.json ./packages/services/whois/

# Copy tsconfig files
COPY tsconfig.json ./
COPY packages/libs/api-server/tsconfig.json ./packages/libs/api-server/
COPY packages/services/whois/tsconfig.json ./packages/services/whois/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/libs/api-server ./packages/libs/api-server/
COPY packages/services/whois ./packages/services/whois/

# Build packages in order
RUN npm run build:api-server
RUN npm run build --workspace=@jk/whois

# Expose the WHOIS service port
EXPOSE 3002

# Start the WHOIS service
CMD ["node", "packages/services/whois/dist/index.js"]
```

## Nginx Reverse Proxy

The project includes an Nginx reverse proxy that routes requests to the appropriate service based on the subdomain:

- **Configuration Template**: `nginx/conf.d/default.conf.template`
- **Entrypoint Script**: `nginx/docker-entrypoint.sh`

### Configuration Template

The Nginx configuration template uses environment variables to configure the domain:

```nginx
server {
    listen 80;
    server_name app.${DOMAIN};

    location / {
        proxy_pass http://app:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name api.${DOMAIN};

    location / {
        proxy_pass http://api:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name whois.${DOMAIN};

    location / {
        proxy_pass http://whois:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Entrypoint Script

The entrypoint script replaces environment variables in the configuration template:

```bash
#!/bin/sh
set -e

# Replace environment variables in the Nginx configuration template
envsubst '${DOMAIN}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Execute the CMD from the Dockerfile
exec "$@"
```

## Next Steps

- Learn how to [configure service URLs](configuration.md)
- Learn how to [build and run with Docker](usage.md)
- Return to the [main documentation](../README.md)