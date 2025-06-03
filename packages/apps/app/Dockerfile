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
RUN npm ci

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
