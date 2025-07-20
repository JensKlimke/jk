FROM node:18-alpine

WORKDIR /app

# Install dependencies
RUN npm init -y && \
    npm install express

# Copy server script and public directory
COPY server.js .

# Expose the port
EXPOSE 3001

# Set environment variables
ENV PORT=3001
ENV WEB_ROOT=/var/www

# Run the server
CMD ["node", "server.js"]
