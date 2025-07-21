# Test Results: Webhook Service Integration Test

## Summary
The test script `test-webhook.js` was successfully executed and verified that the webhook service in the docker-compose stack is functioning correctly. The webhook service successfully processed the artifact URL and extracted the artifact to the correct location.

## Changes Made to the Test Script
To make the test script work with the docker-compose stack, the following changes were made:

1. **SSL Certificate Handling**: Added support for self-signed certificates by configuring the axios client to ignore certificate validation (for testing purposes only).
   ```javascript
   const httpsAgent = new https.Agent({
     rejectUnauthorized: false // Ignore certificate validation (only for testing)
   });
   ```

2. **Port Configuration**: Changed the artifact server port from 3000 to 3002 to avoid conflicts with other services in the docker-compose stack.
   ```javascript
   const ARTIFACT_SERVER_PORT = process.env.ARTIFACT_SERVER_PORT || 3002;
   ```

3. **URL Configuration**: Updated the URLs to use the correct hostnames and protocols:
   - Changed webhook URL to use HTTPS: `https://deploy.localhost/test-app`
   - Used `host.docker.internal` for the artifact server host to make it accessible from Docker containers

4. **Authentication**: Added the correct authentication token from the project's `.env` file:
   ```javascript
   const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'd8TvWJoA8dnE0V4D2ZH0Gsus7CyPYruLHhWGVmH9iovXm8DU8X';
   ```

## Test Results
The webhook service responded with a success message, indicating that it successfully:
1. Authenticated our request using the correct WEBHOOK_SECRET
2. Downloaded the artifact from the provided URL
3. Extracted the artifact to the correct location (`/var/www/test-app`)

Response from the webhook service:
```json
{
  "status": "success",
  "message": "Deployment successful for test-app",
  "details": {
    "artifact_url": "http://host.docker.internal:3002/artifact",
    "extractPath": "/var/www/test-app"
  }
}
```

## Issues Encountered and Solutions
1. **Port Conflict**: The artifact server couldn't start on port 3000 because it was already in use by services in the docker-compose stack. Solution: Changed to port 3002.

2. **SSL Certificate Validation**: The webhook service uses HTTPS with a self-signed certificate, which was rejected by axios. Solution: Added a custom https.Agent to ignore certificate validation.

3. **Authentication Error**: The webhook service requires authentication with a specific token. Solution: Retrieved the correct token from the project's `.env` file and added it to the Authorization header.

## Conclusion
The test script successfully verified that the webhook service is functioning correctly in the docker-compose stack. The service is able to authenticate requests, download artifacts, and extract them to the correct location.