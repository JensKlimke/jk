# Configuring Service URLs

This guide explains how to configure service URLs in the JK project's Docker setup.

## Overview

The frontend app in the JK project needs to communicate with the API and WHOIS services. These service URLs are configured through environment variables that are passed to the frontend app during the build process.

## Docker Compose Configuration

The service URLs are configured in the `docker-compose.yml` file using build arguments:

```yaml
app:
  build:
    context: .
    dockerfile: packages/apps/app/Dockerfile
    args:
      - API_URL=http://api.${DOMAIN:-localhost}/api
      - WHOIS_URL=http://whois.${DOMAIN:-localhost}/api
```

These build arguments are passed to the frontend app's Dockerfile, where they are used to set environment variables for the Vite build process.

## Environment Variables

The build arguments are converted to Vite environment variables in the Dockerfile:

```dockerfile
# Pass environment variables to the build process
RUN VITE_API_URL=$API_URL VITE_WHOIS_URL=$WHOIS_URL npm run build --workspace=@jk/app
```

These environment variables are then used in the frontend app's code:

```typescript
// API URLs
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export const WHOIS_URL = import.meta.env.VITE_WHOIS_URL || 'http://localhost:3002/api';
```

## Domain Configuration

The service URLs use subdomains based on the `DOMAIN` environment variable. If the `DOMAIN` variable is not set, it defaults to `localhost`:

```yaml
- API_URL=http://api.${DOMAIN:-localhost}/api
- WHOIS_URL=http://whois.${DOMAIN:-localhost}/api
```

This allows you to run the services with different domain names without changing the configuration.

## Setting the Domain

You can set the `DOMAIN` environment variable when running Docker Compose:

```bash
# Run with a custom domain
DOMAIN=example.com docker-compose up -d
```

If the `DOMAIN` environment variable is not set, it defaults to `localhost`.

## Local Development

For local development, you may need to add entries to your hosts file to map the subdomains to your local IP address:

```
127.0.0.1 app.localhost
127.0.0.1 api.localhost
127.0.0.1 whois.localhost
```

Or use a custom domain:

```
127.0.0.1 app.example.com
127.0.0.1 api.example.com
127.0.0.1 whois.example.com
```

## Accessing the Services

Once the containers are running, you can access the services through the Nginx reverse proxy using the configured subdomains:

- **Frontend App**: http://app.${DOMAIN}
- **API Service**: http://api.${DOMAIN}
- **WHOIS Service**: http://whois.${DOMAIN}

Where `${DOMAIN}` is the value of the DOMAIN environment variable (defaults to `localhost` if not set).

## Customizing URLs

If you need to use different URLs for the services, you can modify the build arguments in the `docker-compose.yml` file:

```yaml
app:
  build:
    context: .
    dockerfile: packages/apps/app/Dockerfile
    args:
      - API_URL=http://custom-api-url.com/api
      - WHOIS_URL=http://custom-whois-url.com/api
```

This allows you to point the frontend app to services running on different hosts or with different URL structures.

## Configuring OAuth2 Authentication with GitHub

The JK project uses oauth2-proxy to provide authentication for services. By default, it's configured to use GitHub as the authentication provider.

### Setting Up GitHub OAuth Application

To use GitHub authentication, you need to create an OAuth application in GitHub:

1. Go to your GitHub account settings
2. Navigate to "Developer settings" > "OAuth Apps" > "New OAuth App"
3. Fill in the application details:
   - **Application name**: JK Authentication (or any name you prefer)
   - **Homepage URL**: https://app.${DOMAIN} (replace ${DOMAIN} with your actual domain)
   - **Authorization callback URL**: https://auth.${DOMAIN}/oauth2/callback (replace ${DOMAIN} with your actual domain)
4. Click "Register application"
5. After registration, you'll see your Client ID
6. Generate a new client secret by clicking "Generate a new client secret"

### Configuring Environment Variables

Once you have your GitHub OAuth application set up, you need to configure the following environment variables:

```bash
# Required variables
OAUTH2_CLIENT_ID=your_github_client_id
OAUTH2_CLIENT_SECRET=your_github_client_secret
OAUTH2_COOKIE_SECRET=random_secret_string  # Generate a random string for cookie encryption

# Optional variables for restricting access
OAUTH2_GITHUB_ORG=your_github_organization  # Restrict access to members of this GitHub organization
OAUTH2_GITHUB_TEAM=your_github_team        # Restrict access to members of this GitHub team
```

You can set these environment variables when running Docker Compose:

```bash
DOMAIN=example.com \
OAUTH2_CLIENT_ID=your_github_client_id \
OAUTH2_CLIENT_SECRET=your_github_client_secret \
OAUTH2_COOKIE_SECRET=random_secret_string \
docker-compose up -d
```

### Generating a Cookie Secret

The cookie secret is used to encrypt the authentication cookie. You can generate a random string using the following command:

```bash
openssl rand -base64 32
```

### Restricting Access

By default, any GitHub user can authenticate. To restrict access:

- Set `OAUTH2_GITHUB_ORG` to restrict access to members of a specific GitHub organization
- Set `OAUTH2_GITHUB_TEAM` to restrict access to members of a specific team within the organization

### Protected Services

Services can be protected by adding the following label in the docker-compose.yml file:

```yaml
labels:
  - "com.github.nginx-proxy.oauth2-proxy.enable=true"
```

Currently, the frontend app service is protected with this label.

## Next Steps

- Learn how to [build and run with Docker](usage.md)
- Return to [Docker setup](setup.md)
- Return to the [main documentation](../README.md)
