# API Card Service - Production Setup

A Node.js Express service that provides virtual card generation capabilities through multiple payment providers including Conferma, Apple Pay, and Mastercard.

## Features

- **Conferma Virtual Card Generation** - OAuth 2.0 client credentials authentication
- **Apple Pay Integration** - JWT token-based authentication
- **Mastercard VCC** - OAuth 1.0a RSA-SHA1 authentication
- **Health Monitoring** - Built-in health check and authentication status endpoints
- **Production Ready** - Environment-based configuration and logging

## Conferma Authentication Implementation

This service implements the exact Conferma authentication method as specified in their documentation:

### Authentication Flow
1. **Client Credentials Grant**: Uses OAuth 2.0 client credentials flow
2. **Basic Authentication**: Client ID and Secret are Base64 encoded
3. **Token Caching**: Access tokens are cached until expiration
4. **Environment Switching**: Automatic endpoint switching between test and production

### Implementation Details
```javascript
// Base64 encode credentials
const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

// Request token with proper headers
const response = await fetch(tokenEndpoint, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${credentials}`
  },
  body: `grant_type=client_credentials&scope=${SCOPE}`
});
```

## Production Setup

### 1. Environment Configuration

Create or update your `.env` file with production credentials:

```bash
# Environment Configuration
NODE_ENV=production
PORT=3000

# Conferma Production Credentials
CONFERMA_CLIENT_ID=your_production_client_id
CONFERMA_CLIENT_SECRET=your_production_client_secret
CONFERMA_SCOPE=your_production_platform_key_name_pkn
CONFERMA_CLIENT_ACCOUNT_CODE=your_production_client_account_code

# Apple Pay Configuration (if using)
APPLE_JWT_TOKEN=your_apple_jwt_token
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
your_apple_private_key_here
-----END PRIVATE KEY-----"

# Mastercard Configuration (if using)
MASTERCARD_CONSUMER_KEY=your_mastercard_consumer_key
MASTERCARD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
your_mastercard_private_key_here
-----END PRIVATE KEY-----"
```

### 2. Getting Conferma Production Credentials

To obtain your Conferma production credentials:

1. **Contact Conferma**: Reach out to your Conferma account manager
2. **Application Registration**: Register your production application
3. **Receive Credentials**: You will receive:
   - `client_id` - Your unique client identifier
   - `client_secret` - Your client secret key
   - `scope` - Your Platform Key Name (PKN)
   - `client_account_code` - Your client account code

### 3. Installation and Deployment

#### Local Development
```bash
# Install dependencies
npm install

# Start the server
npm start
```

#### Docker Deployment
```bash
# Build the Docker image
docker build -t api-card-service .

# Run with environment variables
docker run -p 3000:3000 --env-file .env api-card-service
```

#### Docker Compose
```bash
# Start with docker-compose
docker-compose up -d
```

### 4. Production Endpoints

#### Health Check
```bash
GET /health
```
Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0"
}
```

#### Authentication Status
```bash
GET /auth/status
```
Response:
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "conferma": {
    "configured": true,
    "tokenCached": true,
    "tokenExpires": "2024-01-01T01:00:00.000Z",
    "tokenValid": true
  },
  "apple": {
    "configured": true
  },
  "mastercard": {
    "configured": true
  }
}
```

#### Test Conferma Authentication
```bash
POST /auth/conferma/test
```
Response:
```json
{
  "status": "success",
  "message": "Conferma authentication successful",
  "responseTime": "245ms",
  "tokenExpires": "2024-01-01T01:00:00.000Z",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 5. API Endpoints

#### Generate Conferma Virtual Card
```bash
POST /conferma-card
Content-Type: application/json

{
  "spendType": "TRAVEL",
  "consumerReference": "REF123",
  "deploymentAmount": 1000,
  "customer": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### Run All Tests
```bash
GET /test
```

### 6. Production Monitoring

The service includes built-in monitoring capabilities:

- **Health Checks**: `/health` endpoint for load balancer health checks
- **Authentication Status**: `/auth/status` for monitoring credential status
- **Request Logging**: Detailed logging of authentication attempts and API calls
- **Error Handling**: Comprehensive error handling with proper HTTP status codes

### 7. Security Considerations

- **Environment Variables**: All sensitive credentials stored in environment variables
- **Token Caching**: Access tokens are cached securely and refreshed automatically
- **Error Handling**: Errors don't expose sensitive credential information
- **HTTPS**: Use HTTPS in production (configure at load balancer/reverse proxy level)

### 8. Deployment Platforms

#### Railway
The service includes `railway.json` configuration for easy Railway deployment:
```bash
# Deploy to Railway
railway up
```

#### Other Platforms
The service is compatible with:
- Heroku
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances
- Any Docker-compatible platform

### 9. Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | Environment (development/production) |
| `PORT` | No | Server port (default: 3000) |
| `CONFERMA_CLIENT_ID` | Yes | Conferma client ID |
| `CONFERMA_CLIENT_SECRET` | Yes | Conferma client secret |
| `CONFERMA_SCOPE` | Yes | Conferma platform key name (PKN) |
| `CONFERMA_CLIENT_ACCOUNT_CODE` | Yes | Conferma client account code |
| `APPLE_JWT_TOKEN` | No | Apple Pay JWT token |
| `APPLE_PRIVATE_KEY` | No | Apple Pay private key |
| `MASTERCARD_CONSUMER_KEY` | No | Mastercard consumer key |
| `MASTERCARD_PRIVATE_KEY` | No | Mastercard private key |

### 10. Troubleshooting

#### Common Issues

1. **Authentication Failed**
   - Verify credentials are correct
   - Check if using production vs test endpoints
   - Ensure scope (PKN) is correct

2. **Token Expired**
   - Tokens are automatically refreshed
   - Check `/auth/status` for token status

3. **Network Issues**
   - Verify firewall allows outbound HTTPS
   - Check DNS resolution for Conferma endpoints

#### Logs
The service provides detailed logging for troubleshooting:
```bash
# View logs in Docker
docker logs <container_id>

# View logs in production
tail -f /var/log/api-card-service.log
```

## Support

For technical support or questions about the Conferma integration, contact your Conferma account manager or technical support team.
