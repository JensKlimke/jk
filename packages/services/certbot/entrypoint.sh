#!/bin/sh
certbot certonly --webroot \
  --webroot-path /var/www/html \
  --agree-tos \
  --non-interactive \
  --email ${EMAIL:-admin@example.com} \
  --domains ${DOMAINS:-example.com} \
  "$@"