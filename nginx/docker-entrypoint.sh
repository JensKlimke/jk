#!/bin/sh
set -e

# Replace environment variables in the Nginx configuration template
envsubst '${DOMAIN}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

echo "Checking certificates..."

# Check if openssl is installed, and install it if not
if ! command -v openssl > /dev/null; then
    echo "OpenSSL not found. Installing..."
    apk add --no-cache openssl
    echo "OpenSSL installed successfully."
fi

## Create a self-signed certificate for initial startup if either the directory or certificate files don't exist
#if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ] || [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ] || [ ! -f "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" ]; then
#    echo "Creating self-signed certificate for initial startup..."
#    mkdir -p /etc/letsencrypt/live/${DOMAIN}
#
#    # Generate a self-signed certificate
#    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
#        -keyout /etc/letsencrypt/live/${DOMAIN}/privkey.pem \
#        -out /etc/letsencrypt/live/${DOMAIN}/fullchain.pem \
#        -subj "/CN=${DOMAIN}" \
#        -addext "subjectAltName=DNS:${DOMAIN},DNS:app.${DOMAIN},DNS:api.${DOMAIN},DNS:whois.${DOMAIN}"
#
#    echo "Self-signed certificate created."
#else
#    echo "Found valid certificates. Starting server..."
#fi

# Execute the CMD from the Dockerfile
exec "$@"
