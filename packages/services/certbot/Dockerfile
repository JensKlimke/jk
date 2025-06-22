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
WORKDIR /app

# Create entrypoint script
RUN echo '#!/bin/sh\n\
certbot certonly --webroot \
  --webroot-path /var/www/html \
  --agree-tos \
  --non-interactive \
  --email ${EMAIL:-admin@example.com} \
  --domains ${DOMAINS:-localhost} \
  "$@"\n' > /entrypoint.sh && chmod +x /entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]