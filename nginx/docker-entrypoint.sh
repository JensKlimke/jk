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

# Check for Let's Encrypt certificates with suffixes (e.g., domain-0001)
CERT_FOUND=false
for CERT_DIR in /etc/letsencrypt/live/${DOMAIN}*; do
    if [ -d "$CERT_DIR" ] && [ -f "$CERT_DIR/fullchain.pem" ] && [ -f "$CERT_DIR/privkey.pem" ]; then
        if [ "$CERT_DIR" != "/etc/letsencrypt/live/${DOMAIN}" ]; then
            echo "Found Let's Encrypt certificates in $CERT_DIR"
            # Create the base directory if it doesn't exist
            mkdir -p /etc/letsencrypt/live/${DOMAIN}

            # Create symbolic links to the actual certificate files
            ln -sf "$CERT_DIR/fullchain.pem" "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"
            ln -sf "$CERT_DIR/privkey.pem" "/etc/letsencrypt/live/${DOMAIN}/privkey.pem"
            ln -sf "$CERT_DIR/chain.pem" "/etc/letsencrypt/live/${DOMAIN}/chain.pem" 2>/dev/null || true
            ln -sf "$CERT_DIR/cert.pem" "/etc/letsencrypt/live/${DOMAIN}/cert.pem" 2>/dev/null || true

            echo "Created symbolic links from /etc/letsencrypt/live/${DOMAIN}/ to $CERT_DIR"
            CERT_FOUND=true
            break
        else
            # Certificates already exist in the expected location
            CERT_FOUND=true
        fi
    fi
done

# Create a self-signed certificate for initial startup if no valid certificates were found
if [ "$CERT_FOUND" = false ]; then
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
    echo "Found valid certificates. Starting server..."
fi

# Execute the CMD from the Dockerfile
exec "$@"
