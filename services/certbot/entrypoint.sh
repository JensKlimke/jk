#!/bin/sh

# List of domains to obtain certificates for
DOMAINS=""
CERTS_PATH="/etc/letsencrypt/live"

# Email address for certificate registration
EMAIL="jens.klimke@rwth-aachen.de"

# Function to obtain/renew certificate for a specific domain
obtain_cert() {
    local domain=$1
    local option=$2
    echo "Processing certificate for $domain..."
    certbot certonly --webroot --webroot-path=/var/www/certbot \
        --email $EMAIL --agree-tos --no-eff-email \
        -d $domain $option
}

# Process each domain
process_domains() {
    local option=$1
    for domain in $DOMAINS; do
        local cert_path="$CERTS_PATH/$domain/fullchain.pem"

        # Check if certificate exists for this domain
        if [ ! -f "$cert_path" ]; then
            echo "Certificate for $domain does not exist. Obtaining immediately..."
            obtain_cert "$domain" "--force-renewal"
        else
            echo "Certificate for $domain already exists. Setting up renewal schedule..."
            obtain_cert "$domain" "$option"
        fi
    done
}

# Initial processing of all domains
process_domains "--keep"

# Set up the renewal schedule
trap exit TERM
while :; do

    # Sleep for 12 hours before attempting renewal
    echo "Waiting 12 hours before next certificate renewal check..."
    sleep 12h & wait $!

    # Let certbot decide if renewal is necessary based on expiration date
    # (certificates are typically renewed when they're within 30 days of expiry)
    echo "Checking certificate renewal for all domains..."
    process_domains "--keep"

done
