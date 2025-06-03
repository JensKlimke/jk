#!/bin/sh
set -e

# This script is used to renew Let's Encrypt certificates

# Renew the certificates
certbot renew --webroot --webroot-path=/var/www/html

# Reload Nginx to use the new certificates
nginx -s reload

echo "Certificates renewed successfully"