# Certbot Docker Container

This Docker container provides a simple way to obtain and renew SSL certificates from Let's Encrypt using the webroot authentication method.

## Overview

The container uses Certbot to request SSL certificates from Let's Encrypt. It uses the webroot authentication method, which requires that you have a web server running and accessible on port 80 for the domains you're requesting certificates for.

## Building the Container

```bash
docker build -t certbot-local ./packages/services/certbot
```

### With Build-time Arguments

You can pass environment variables from your system during the build process:

```bash
docker build --build-arg EMAIL=your-email@example.com --build-arg DOMAINS=your-domain.com -t certbot-local ./packages/services/certbot
```

## Running the Container

### For Production

```bash
docker run -v /path/to/certs:/etc/letsencrypt -v /path/to/webroot:/var/www/html certbot-local
```

### For Testing (Dry Run)

To test the process without actually requesting certificates:

```bash
docker run -v $(pwd)/test/certs:/etc/letsencrypt -v $(pwd)/www_html:/var/www/html certbot-local --dry-run
```

## Volume Mounts

- `/etc/letsencrypt`: Directory for storing certificates
- `/var/www/html`: Directory for webroot challenge (must be accessible by your web server)

## Environment Variables

- `EMAIL`: Email address for Let's Encrypt notifications (default: admin@example.com)
- `DOMAINS`: Comma-separated list of domains to obtain certificates for (default: example.com)

These environment variables can be set in two ways:

### At Build Time

Using build arguments to set the default values in the image:

```bash
docker build --build-arg EMAIL=your-email@example.com --build-arg DOMAINS=your-domain.com -t certbot-local ./packages/services/certbot
```

### At Runtime

Overriding the default values when running the container:

```bash
docker run -e EMAIL=your-email@example.com -e DOMAINS=your-domain.com -v /path/to/certs:/etc/letsencrypt -v /path/to/webroot:/var/www/html certbot-local
```

## Integration with Docker Compose

To integrate with your existing setup, add a service to your docker-compose.yml:

```yaml
certbot:
  build:
    context: .
    dockerfile: packages/services/certbot/Dockerfile
    args:
      - EMAIL=${EMAIL:-your-email@example.com}
      - DOMAINS=${DOMAINS:-your-domain.com}
  volumes:
    - ./certs:/etc/letsencrypt
    - www_html:/var/www/html
  environment:
    - EMAIL=${EMAIL:-your-email@example.com}
    - DOMAINS=${DOMAINS:-your-domain.com}
```

This example shows how to use both build-time arguments and runtime environment variables. The `args` section passes variables during the build process, while the `environment` section sets them at runtime. Using `${EMAIL:-default}` syntax allows you to use environment variables from your system or fall back to default values.
