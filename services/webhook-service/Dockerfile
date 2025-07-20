# Build stage
FROM node:16-alpine AS build

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm install

# Bundle app source
COPY . .

# Build TypeScript
RUN npm run build

# Runtime stage
FROM node:16-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy built application from build stage
COPY --from=build /usr/src/app/dist ./dist

# Create temp directory for artifacts
RUN mkdir -p temp

# Create directory for logs
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Start the service
CMD ["node", "dist/index.js"]