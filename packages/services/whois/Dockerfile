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
