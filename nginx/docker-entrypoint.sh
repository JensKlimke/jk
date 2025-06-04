#!/bin/sh
set -e

# Replace environment variables in the Nginx configuration template
envsubst '${DOMAIN}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Checking certificates..."

# Create a self-signed certificate for initial startup
if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
    echo "Creating self-signed certificate for initial startup..."
    mkdir -p /etc/letsencrypt/live/${DOMAIN}

    # Generate a self-signed certificate
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/letsencrypt/live/${DOMAIN}/privkey.pem \
        -out /etc/letsencrypt/live/${DOMAIN}/fullchain.pem \
        -subj "/CN=${DOMAIN}" \
        -addext "subjectAltName=DNS:${DOMAIN},DNS:app.${DOMAIN},DNS:api.${DOMAIN},DNS:whois.${DOMAIN}"

    echo "Self-signed certificate created."
else
  echo "Found certificate folder. Starting server..."
fi

# Execute the CMD from the Dockerfile
exec "$@"
