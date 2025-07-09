FROM node:18-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create a script to run the service
RUN printf '#!/bin/sh\nnode dist/index.js /app/template/service.conf.mustache /app/services.json /app/output/services.conf\n' > /app/run.sh && chmod +x /app/run.sh

# Create directories for input and output
RUN mkdir -p /app/template /app/output

# Set the entrypoint
ENTRYPOINT ["/app/run.sh"]
