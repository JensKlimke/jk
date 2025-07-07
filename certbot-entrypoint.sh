#!/bin/sh

# Path to the certificate
CERT_PATH="/etc/letsencrypt/live/whoami.marlene.cloud/fullchain.pem"

# Function to obtain/renew certificate
obtain_cert() {
    certbot certonly --webroot --webroot-path=/var/www/certbot \
        --email jens.klimke@rwth-aachen.de --agree-tos --no-eff-email \
        -d whoami.marlene.cloud $1
}

# Check if certificate exists
if [ ! -f "$CERT_PATH" ]; then
    echo "Certificate does not exist. Obtaining immediately..."
    obtain_cert ""
else
    echo "Certificate already exists. Setting up renewal schedule..."
fi

# Set up the renewal schedule
trap exit TERM
while :; do
    # Use --force-renewal only if you want to force renewal regardless of expiration
    # For normal operation, omit this flag to let certbot decide based on expiration date
    obtain_cert "--force-renewal"
    
    # Sleep for 12 hours
    sleep 12h & wait $!
done