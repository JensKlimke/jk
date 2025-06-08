# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json files
COPY package.json package-lock.json ./
COPY packages/services/service_controller/package.json ./packages/services/service_controller/

# Copy tsconfig files
COPY tsconfig.json ./
COPY packages/services/service_controller/tsconfig.json ./packages/services/service_controller/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/services/service_controller ./packages/services/service_controller/

# Build the package
RUN npm run build --workspace=@jk/service_controller

# Execution stage
FROM node:18-alpine

WORKDIR /app

# Install Docker CLI (needed for runtime)
RUN apk add --no-cache docker-cli

# Copy package.json files (needed for node_modules resolution)
COPY package.json package-lock.json ./
COPY packages/services/service_controller/package.json ./packages/services/service_controller/

# Install production dependencies only
RUN npm ci --production

# Copy built application from build stage
COPY --from=build /app/packages/services/service_controller/dist ./packages/services/service_controller/dist

# Expose any necessary ports (none needed for this service)

# Start the service controller
CMD ["node", "packages/services/service_controller/dist/index.js"]
