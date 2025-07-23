# Development Guide

This document provides information for developers working on the infrastructure and services.

## Development Environment Setup

For local development, you can use the `docker-compose.override.yml` file to customize your environment.

### Using docker-compose.override.yml

1. Create your override file from the template:

```bash
cp docker-compose.override.yml.template docker-compose.override.yml
```

2. Customize the override file for your development needs.

### Local Environment Variables

You can create a `.env.local` file with development-specific variables:

```bash
# .env.local example
NODE_ENV=development
DOMAIN=localhost
```

Then, when running locally, combine them:

```bash
cat .env .env.local > .env.combined && mv .env.combined .env
```

## API Service Development

When developing the API service, you have several options:

### Option 1: Using Hot Reload in Docker

The development setup includes hot reloading with Nodemon:

1. Make sure you have the development override enabled
2. Start the services: `make start`
3. Edit files in `services/api-service/` and see changes applied instantly

### Option 2: Running API Locally

You can also run the API service directly on your machine:

```bash
cd services/api-service
npm install
npm run dev
```

You'll need to configure environment variables in a local `.env` file in the API service directory:

```bash
NODE_ENV=development
PORT=3000
API_TOKEN=your_api_token
JWT_SECRET=your_jwt_secret
POSTGRES_HOST=localhost
POSTGRES_DB=appdb
POSTGRES_USER=appuser
POSTGRES_PASSWORD=your_postgres_password
REDIS_HOST=localhost
REDIS_PASSWORD=your_redis_password
```

## Database Development

### Local Access to PostgreSQL

To connect to the PostgreSQL database from your local machine:

```bash
docker-compose exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB
```

Or use the Adminer UI available at `https://admin.yourdomain.com` if you've enabled it in your override file.

### Local Access to Redis

To connect to Redis from your local machine:

```bash
docker-compose exec redis redis-cli -a $REDIS_PASSWORD
```

## Testing Changes

### API Testing

You can test the API endpoints using curl or any API client:

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test protected endpoint
curl -H "Authorization: Bearer $API_TOKEN" http://localhost:3000/api/status
```

### Running Tests

To run the API tests:

```bash
cd services/api-service
npm test
```

## Common Development Tasks

### Adding a New API Endpoint

1. Open `services/api-service/server.js`
2. Add a new route, for example:

```javascript
app.get('/api/new-endpoint', authenticateToken, (req, res) => {
  res.json({ message: 'New endpoint works!' });
});
```

### Adding a New Dependency

1. Add the dependency to `services/api-service/package.json`
2. Rebuild the container: `docker-compose build api-service`
3. Restart the service: `docker-compose up -d api-service`

### Adding a New Service

1. Create a new directory in `services/`
2. Add the service configuration to `docker-compose.yml`
3. Configure Traefik labels for routing
4. Add necessary environment variables to `.env.template`

## Troubleshooting Development Issues

### API Service Not Reloading

If the API service isn't reloading when you make changes:

1. Check that you're using the development override
2. Verify that Nodemon is running (check logs: `docker-compose logs api-service`)
3. Ensure file permissions are correct

### Database Connection Issues

If the API service can't connect to the database:

1. Check if the database container is running: `docker-compose ps postgres`
2. Verify environment variables are correctly set
3. Check network configuration

### Environment Variable Problems

If environment variables aren't being picked up:

1. Make sure the variable is defined in your `.env` file
2. Restart the service to apply changes: `docker-compose restart api-service`
3. Check for typos in variable names

## Best Practices

1. **Use environment variables** for all configuration
2. **Never commit secrets** to version control
3. **Write tests** for new API endpoints
4. **Document changes** in the appropriate docs files
5. **Follow code style** of the existing codebase
6. **Use semantic versioning** for releases
