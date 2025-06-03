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
