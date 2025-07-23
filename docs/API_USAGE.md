# API Usage Guide

This document provides information on how to use the API service including authentication, endpoints, and examples.

## Authentication

The API supports two authentication methods:

1. **API Token Authentication** - For service-to-service communication
2. **JWT Authentication** - For user-based access (if implemented)

### API Token Authentication

To authenticate using an API token, include the token in the `Authorization` header:

```
Authorization: Bearer YOUR_API_TOKEN
```

Replace `YOUR_API_TOKEN` with the token specified in your `.env` file.

Example using curl:

```bash
curl -X GET https://api.yourdomain.com/api/status \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

Example using JavaScript fetch:

```javascript
fetch('https://api.yourdomain.com/api/status', {
  headers: {
    'Authorization': 'Bearer YOUR_API_TOKEN'
  }
})
.then(response => response.json())
.then(data => console.log(data));
```

### JWT Authentication

If you've implemented JWT authentication in your API, you can authenticate using a JWT token:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

You would typically obtain a JWT token by authenticating through a login endpoint (not included in the base implementation).

## Endpoints

### Public Endpoints

#### Health Check

```
GET /health
```

Returns the health status of the API and its dependencies.

Response example:

```json
{
  "status": "healthy",
  "timestamp": "2023-07-25T12:34:56.789Z",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### Protected Endpoints

#### Status

```
GET /api/status
```

Returns the current status of the API and user information.

Response example:

```json
{
  "status": "running",
  "user": {
    "name": "api",
    "role": "service"
  },
  "timestamp": "2023-07-25T12:34:56.789Z"
}
```

#### Data

```
GET /api/data
```

Returns sample data from the database.

Response example:

```json
{
  "time": "2023-07-25T12:34:56.789Z",
  "message": "Data retrieved successfully",
  "items": [
    { "id": 1, "name": "Item 1" },
    { "id": 2, "name": "Item 2" },
    { "id": 3, "name": "Item 3" }
  ]
}
```

## Error Handling

The API returns standard HTTP status codes and JSON error responses.

### Common Error Codes

- **400 Bad Request** - Invalid request parameters
- **401 Unauthorized** - Missing authentication
- **403 Forbidden** - Invalid or expired token
- **404 Not Found** - Resource not found
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - Server-side error

Error response format:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Rate Limiting

The API has rate limiting enabled to prevent abuse. By default, it allows 100 requests per IP address per 15-minute window. When the limit is reached, you'll receive a 429 status code.

## Examples

### Node.js Example

```javascript
const axios = require('axios');

const API_URL = 'https://api.yourdomain.com';
const API_TOKEN = 'your-api-token';

async function callApi() {
  try {
    const response = await axios.get(`${API_URL}/api/data`, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`
      }
    });

    console.log('API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    throw error;
  }
}

callApi();
```

### Python Example

```python
import requests

API_URL = 'https://api.yourdomain.com'
API_TOKEN = 'your-api-token'

def call_api():
    headers = {
        'Authorization': f'Bearer {API_TOKEN}'
    }

    try:
        response = requests.get(f'{API_URL}/api/data', headers=headers)
        response.raise_for_status()

        data = response.json()
        print('API Response:', data)
        return data
    except requests.exceptions.HTTPError as e:
        print('API Error:', response.json())
        raise e
    except Exception as e:
        print('Error:', str(e))
        raise e

call_api()
```

### cURL Example

```bash
# Health check (public)
curl -X GET https://api.yourdomain.com/health

# Protected endpoint with token
curl -X GET https://api.yourdomain.com/api/data \
  -H "Authorization: Bearer your-api-token"
```

## Security Considerations

1. **Keep your API token secure** - Don't expose it in client-side code or public repositories
2. **Use HTTPS only** - All API communication is enforced over HTTPS
3. **Implement least privilege** - Only request the access you need
4. **Monitor usage** - Check logs regularly for unauthorized access attempts

## Additional Resources

- For API development, see the Node.js API code in `/services/api-service/server.js`
- To extend the API with new endpoints, add routes to the Express application
- For database queries, use the PostgreSQL pool provided in the API service
