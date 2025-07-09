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
COPY run.sh /app/
RUN chmod +x /app/run.sh

# Create directories for input and output
RUN mkdir -p /app/template /app/output

# Set the entrypoint
ENTRYPOINT ["/app/run.sh"]
