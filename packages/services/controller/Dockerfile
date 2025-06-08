# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package.json files
COPY package.json package-lock.json ./
COPY packages/services/controller/package.json ./packages/services/controller/

# Copy tsconfig files
COPY tsconfig.json ./
COPY packages/services/controller/tsconfig.json ./packages/services/controller/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/services/controller ./packages/services/controller/

# Build the package
RUN npm run build --workspace=@jk/controller

# Execution stage
FROM node:18-alpine

WORKDIR /app

# Install Docker CLI (needed for runtime)
RUN apk add --no-cache docker-cli

# Copy package.json files (needed for node_modules resolution)
COPY package.json package-lock.json ./
COPY packages/services/controller/package.json ./packages/services/controller/

# Install production dependencies only
RUN npm ci --production

# Copy built application from build stage
COPY --from=build /app/packages/services/controller/dist ./packages/services/controller/dist

# Expose the API port
EXPOSE 3000
ENV PORT=3000

# Start the service controller
CMD ["node", "packages/services/controller/dist/index.js"]
