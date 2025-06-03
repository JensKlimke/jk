#!/bin/sh
set -e

# Replace environment variables in the Nginx configuration template
envsubst '${DOMAIN}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Execute the CMD from the Dockerfile
exec "$@"