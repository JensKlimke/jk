#!/bin/sh
set -e

# This script is used to renew Let's Encrypt certificates

# Check if certbot is already running
if pgrep -f "certbot" > /dev/null; then
    echo "Another instance of Certbot is already running. Skipping renewal."
else
    # Renew the certificates
    certbot renew --webroot --webroot-path=/var/www/html
fi

# Reload Nginx to use the new certificates
nginx -s reload

echo "Certificates renewed successfully"
