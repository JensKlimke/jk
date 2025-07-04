# Use Python Alpine as base image
FROM python:3.9-alpine

# Install required packages
RUN apk add --no-cache --virtual .build-deps \
    gcc \
    musl-dev \
    python3-dev \
    libffi-dev \
    openssl-dev \
    cargo \
    && pip install --no-cache-dir certbot \
    && apk del .build-deps

# Create directory for webroot challenge
RUN mkdir -p /var/www/html

# Create directory for certificates
RUN mkdir -p /etc/letsencrypt

# Set working directory
WORKDIR /

# Define build arguments with default values
# These can be overridden during build with --build-arg
# Example: docker build --build-arg EMAIL=your@email.com --build-arg DOMAINS=yourdomain.com -t certbot-local .
ARG EMAIL=admin@example.com
ARG DOMAINS=example.com

# Set environment variables from build arguments
# This makes the build-time values available at runtime
# These can still be overridden at runtime with -e
# Example: docker run -e EMAIL=another@email.com -e DOMAINS=anotherdomain.com certbot-local
ENV EMAIL=${EMAIL}
ENV DOMAINS=${DOMAINS}

# Copy entrypoint script
# The "$@" at the end allows passing additional arguments like --dry-run
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Usage:
# Build: docker build -t certbot-local ./packages/services/certbot
# Run for testing: docker run -v $(pwd)/test/certs:/etc/letsencrypt -v $(pwd)/www_html:/var/www/html certbot-local --dry-run
# 
# Volume mounts:
# - $(pwd)/test/certs:/etc/letsencrypt - Directory for storing certificates
# - $(pwd)/www_html:/var/www/html - Directory for webroot challenge
#
# Environment variables:
# - EMAIL - Email address for Let's Encrypt notifications (default: admin@example.com)
# - DOMAINS - Comma-separated list of domains to obtain certificates for (default: example.com)
