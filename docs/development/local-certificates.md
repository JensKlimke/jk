# Local Self-Signed Certificates

This guide explains how to create local self-signed certificates for new sub-domains in the JK project.

## Overview

When developing locally, you may need to create new sub-domains with HTTPS support. This guide will walk you through the process of creating self-signed certificates for local development.

## Prerequisites

- OpenSSL installed on your system
- Administrative access to modify your hosts file (for local domain resolution)

## Creating Self-Signed Certificates

### Step 1: Create a Directory for Your Certificates

For each new sub-domain, create a directory in the appropriate location:

```bash
# For development/testing
mkdir -p test/certs/your-subdomain.localhost

# For production-like environment
mkdir -p /etc/nginx/certs/your-subdomain.localhost
```

### Step 2: Generate a Private Key

```bash
openssl genrsa -out test/certs/your-subdomain.localhost/privkey.pem 2048
```

### Step 3: Create a Certificate Signing Request (CSR)

Create a configuration file named `openssl.cnf` with the following content:

```
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = req_ext

[dn]
CN = your-subdomain.localhost

[req_ext]
subjectAltName = @alt_names

[alt_names]
DNS.1 = your-subdomain.localhost
```

Then generate the CSR:

```bash
openssl req -new -key test/certs/your-subdomain.localhost/privkey.pem -out test/certs/your-subdomain.localhost/csr.pem -config openssl.cnf
```

### Step 4: Generate the Self-Signed Certificate

```bash
openssl x509 -req -days 365 -in test/certs/your-subdomain.localhost/csr.pem -signkey test/certs/your-subdomain.localhost/privkey.pem -out test/certs/your-subdomain.localhost/fullchain.pem -extensions req_ext -extfile openssl.cnf
```

### Step 5: Verify the Certificate

```bash
openssl x509 -text -noout -in test/certs/your-subdomain.localhost/fullchain.pem
```

## One-Line Command for Quick Generation

For convenience, you can use this one-line command to generate both the private key and certificate:

```bash
DOMAIN="your-subdomain.localhost" && \
mkdir -p test/certs/$DOMAIN && \
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout test/certs/$DOMAIN/privkey.pem \
  -out test/certs/$DOMAIN/fullchain.pem \
  -subj "/CN=$DOMAIN" \
  -addext "subjectAltName=DNS:$DOMAIN"
```

## Adding the Sub-Domain to Your Hosts File

To access your sub-domain locally, add an entry to your hosts file:

### On Linux/macOS

```bash
sudo sh -c 'echo "127.0.0.1 your-subdomain.localhost" >> /etc/hosts'
```

### On Windows

Add the following line to `C:\Windows\System32\drivers\etc\hosts`:

```
127.0.0.1 your-subdomain.localhost
```

## Configuring Nginx

After creating the certificates, you need to update the Nginx configuration to use them. Create a new configuration file in the `nginx/conf.d.tmpl/` directory:

```
# nginx/conf.d.tmpl/your-subdomain.sec.conf
server {
    listen 443 ssl;
    server_name your-subdomain.{{ domain }};

    # Certs
    ssl_certificate /etc/nginx/certs/your-subdomain.{{ domain }}/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/your-subdomain.{{ domain }}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Your configuration here
    location / {
        proxy_pass http://your-service:port;
        # Additional proxy settings
    }
}
```

## Trusting Self-Signed Certificates in Your Browser

Self-signed certificates will show security warnings in browsers. To avoid these warnings:

### Chrome/Edge

1. Navigate to your sub-domain (e.g., https://your-subdomain.localhost)
2. Click on "Advanced" or "Details"
3. Click "Proceed to site" (unsafe)
4. Click the padlock icon in the address bar
5. Click "Certificate (Invalid)"
6. Click "Details" tab
7. Click "Export" and save the certificate
8. Open Chrome/Edge settings
9. Search for "certificates" and open "Manage certificates"
10. Go to "Trusted Root Certification Authorities" tab
11. Click "Import" and select the exported certificate

### Firefox

1. Navigate to your sub-domain
2. Click "Advanced"
3. Click "Accept the Risk and Continue"
4. Click the padlock icon with the warning
5. Click "Connection not secure" > "More Information"
6. Click "View Certificate"
7. Click "I Understand the Risks" > "Add Exception" > "Confirm Security Exception"

## Troubleshooting

### Certificate Not Found

If Nginx reports that it cannot find the certificate files, check:

1. The certificate files exist in the correct location
2. The file permissions allow Nginx to read the files
3. The paths in the Nginx configuration match the actual file locations

### Browser Security Warnings

If you still see security warnings after trusting the certificate:

1. Clear your browser cache
2. Restart your browser
3. Ensure the certificate's Common Name (CN) matches the domain you're accessing

### Certificate Expiration

Self-signed certificates typically expire after a year. If your certificate expires, simply generate a new one following the steps above.