# Build stage
FROM golang:1.21-alpine as builder

# Install build dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum
COPY go.mod ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o service-manager ./cmd/service-manager

# Runtime stage
FROM certbot/certbot:latest

# Install runtime dependencies
RUN apk add --no-cache docker-cli openssl

# Copy the built binary from the builder stage
COPY --from=builder /app/service-manager /usr/local/bin/service-manager

# Set environment variables
ENV LOG_LEVEL=info

# Create necessary directories
RUN mkdir -p /var/www/certbot /etc/letsencrypt/live

# Set the entrypoint
ENTRYPOINT ["/usr/local/bin/service-manager"]