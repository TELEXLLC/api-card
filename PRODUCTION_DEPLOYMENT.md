# Production Deployment Guide

## Quick Start for Production

### 1. Update Environment Variables

Replace the placeholder values in `.env` with your actual Conferma production credentials:

```bash
# Conferma Production Credentials - REPLACE WITH ACTUAL VALUES
CONFERMA_CLIENT_ID=your_actual_production_client_id
CONFERMA_CLIENT_SECRET=your_actual_production_client_secret
CONFERMA_SCOPE=your_actual_production_platform_key_name_pkn
CONFERMA_CLIENT_ACCOUNT_CODE=your_actual_production_client_account_code
```

### 2. Deploy Options

#### Option A: Docker (Recommended)
```bash
# Build and run
docker build -t api-card-service .
docker run -p 3000:3000 --env-file .env api-card-service
```

#### Option B: Direct Node.js
```bash
# Install and start
npm install --production
NODE_ENV=production npm start
```

#### Option C: Docker Compose
```bash
docker-compose up -d
```

### 3. Verify Deployment

After deployment, verify the service is working:

```bash
# Health check
curl https://your-domain.com/health

# Authentication status
curl https://your-domain.com/auth/status

# Test Conferma authentication (should succeed with real credentials)
curl -X POST https://your-domain.com/auth/conferma/test
```

### 4. Production Endpoints

Your service will be available at:
- **Main Interface**: `https://your-domain.com/`
- **Health Check**: `https://your-domain.com/health`
- **Auth Status**: `https://your-domain.com/auth/status`
- **Conferma Test**: `POST https://your-domain.com/auth/conferma/test`
- **Generate Card**: `POST https://your-domain.com/conferma-card`

### 5. Monitoring

Monitor your production deployment:
- Health checks every 30 seconds via `/health`
- Authentication status via `/auth/status`
- Docker health checks built-in
- Application logs for troubleshooting

### 6. Security Checklist

- ✅ Environment variables configured
- ✅ HTTPS enabled (configure at load balancer level)
- ✅ Non-root user in Docker container
- ✅ Production endpoints configured
- ✅ Error handling without credential exposure
- ✅ Health checks enabled

## Current Status

✅ **Service is running at**: http://0b32a15873e7605b87.blackbx.ai
✅ **Health check working**: http://0b32a15873e7605b87.blackbx.ai/health
✅ **Authentication configured**: Ready for production credentials
✅ **Docker optimized**: Production-ready container
✅ **Monitoring enabled**: Health and auth status endpoints
