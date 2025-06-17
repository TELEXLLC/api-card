# Railway Production Deployment Guide

## 🚀 Deploy to Railway with Your Conferma Credentials

### Prerequisites
1. Railway account (sign up at https://railway.app)
2. Your actual Conferma production credentials
3. This repository pushed to GitHub

### Step 1: Prepare Your Credentials

**IMPORTANT**: You need to replace the placeholder values in `.env.production` with your actual Conferma production credentials:

```bash
CONFERMA_CLIENT_ID=your_actual_production_client_id
CONFERMA_CLIENT_SECRET=your_actual_production_client_secret  
CONFERMA_SCOPE=your_actual_production_platform_key_name_pkn
```

### Step 2: Deploy to Railway

#### Option A: Deploy via Railway Dashboard (Recommended)

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Create New Project**: Click "New Project"
3. **Deploy from GitHub**: Select "Deploy from GitHub repo"
4. **Select Repository**: Choose `TELEXLLC/api-card`
5. **Select Branch**: Choose `conferma-auth-production`
6. **Configure Environment Variables**:
   - Go to your project → Variables tab
   - Add the following environment variables:

```
NODE_ENV=production
PORT=3000
CONFERMA_CLIENT_ID=your_actual_production_client_id
CONFERMA_CLIENT_SECRET=your_actual_production_client_secret
CONFERMA_SCOPE=your_actual_production_platform_key_name_pkn
```

7. **Deploy**: Railway will automatically build and deploy your application

#### Option B: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set CONFERMA_CLIENT_ID=your_actual_production_client_id
railway variables set CONFERMA_CLIENT_SECRET=your_actual_production_client_secret
railway variables set CONFERMA_SCOPE=your_actual_production_platform_key_name_pkn

# Deploy
railway up
```

### Step 3: Verify Deployment

After deployment, Railway will provide you with a URL like: `https://your-app-name.railway.app`

Test your deployment:

```bash
# Health check
curl https://your-app-name.railway.app/health

# Authentication status
curl https://your-app-name.railway.app/auth/status

# Test Conferma authentication (should succeed with real credentials)
curl -X POST https://your-app-name.railway.app/auth/conferma/test
```

### Step 4: Production Endpoints

Your Railway deployment will have these endpoints:

- **Main Interface**: `https://your-app-name.railway.app/`
- **Health Check**: `https://your-app-name.railway.app/health`
- **Auth Status**: `https://your-app-name.railway.app/auth/status`
- **Conferma Test**: `POST https://your-app-name.railway.app/auth/conferma/test`
- **Generate Card**: `POST https://your-app-name.railway.app/conferma-card`

### Step 5: Environment Variables Reference

Set these in Railway Dashboard → Your Project → Variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3000` | Server port |
| `CONFERMA_CLIENT_ID` | `your_actual_client_id` | Your Conferma client ID |
| `CONFERMA_CLIENT_SECRET` | `your_actual_client_secret` | Your Conferma client secret |
| `CONFERMA_SCOPE` | `your_actual_pkn` | Your Platform Key Name (PKN) |

### Step 6: Monitoring and Logs

#### View Logs
```bash
# Via CLI
railway logs

# Or check in Railway Dashboard → Your Project → Deployments → View Logs
```

#### Health Monitoring
- Railway automatically monitors your app health
- Use `/health` endpoint for external monitoring
- Use `/auth/status` to monitor authentication status

### Step 7: Custom Domain (Optional)

1. Go to Railway Dashboard → Your Project → Settings
2. Click "Domains"
3. Add your custom domain
4. Configure DNS records as instructed

### Troubleshooting

#### Common Issues

1. **Authentication Failed**
   - Verify credentials are correct in Railway Variables
   - Check logs for specific error messages
   - Ensure using production endpoints

2. **Build Failed**
   - Check Railway build logs
   - Verify `package.json` and dependencies
   - Ensure `railway.json` is properly configured

3. **App Not Starting**
   - Check if PORT environment variable is set
   - Verify server.js starts correctly
   - Check Railway deployment logs

#### Support Commands

```bash
# Check deployment status
railway status

# View environment variables
railway variables

# Restart deployment
railway redeploy
```

### Security Notes

- ✅ All credentials stored as environment variables
- ✅ Production endpoints automatically selected
- ✅ HTTPS enabled by default on Railway
- ✅ Health checks and monitoring enabled
- ✅ Error handling without credential exposure

### Next Steps After Deployment

1. **Test all endpoints** with real credentials
2. **Set up monitoring** alerts for your production service
3. **Configure custom domain** if needed
4. **Set up CI/CD** for automatic deployments on code changes

---

## Quick Deploy Checklist

- [ ] Railway account created
- [ ] Actual Conferma credentials obtained
- [ ] Environment variables configured in Railway
- [ ] Application deployed successfully
- [ ] Health check endpoint responding
- [ ] Conferma authentication test passing
- [ ] Production URL documented and shared

**Your production service will be ready at**: `https://your-app-name.railway.app`
