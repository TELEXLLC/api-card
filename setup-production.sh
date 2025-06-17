#!/bin/bash

# Production Setup Script for Railway Deployment
# This script helps you configure your production environment

echo "🚀 API Card Service - Production Setup"
echo "======================================"
echo ""

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production file not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

echo "📋 Current Configuration Status:"
echo ""

# Check current values in .env.production
echo "Checking .env.production file..."
if grep -q "your_actual_production_client_id" .env.production; then
    echo "❌ CONFERMA_CLIENT_ID: Not configured (still placeholder)"
else
    echo "✅ CONFERMA_CLIENT_ID: Configured"
fi

if grep -q "your_actual_production_client_secret" .env.production; then
    echo "❌ CONFERMA_CLIENT_SECRET: Not configured (still placeholder)"
else
    echo "✅ CONFERMA_CLIENT_SECRET: Configured"
fi

if grep -q "your_actual_production_platform_key_name_pkn" .env.production; then
    echo "❌ CONFERMA_SCOPE: Not configured (still placeholder)"
else
    echo "✅ CONFERMA_SCOPE: Configured"
fi



echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Edit .env.production file with your actual Conferma credentials:"
echo "   nano .env.production"
echo ""
echo "2. Replace these placeholder values:"
echo "   - CONFERMA_CLIENT_ID=your_actual_production_client_id"
echo "   - CONFERMA_CLIENT_SECRET=your_actual_production_client_secret"
echo "   - CONFERMA_SCOPE=your_actual_production_platform_key_name_pkn"
echo ""
echo "3. Deploy to Railway:"
echo "   - Go to https://railway.app/dashboard"
echo "   - Create new project from GitHub repo: TELEXLLC/api-card"
echo "   - Select branch: conferma-auth-production"
echo "   - Add environment variables from .env.production"
echo ""
echo "4. Test your deployment:"
echo "   curl https://your-app-name.railway.app/health"
echo "   curl -X POST https://your-app-name.railway.app/auth/conferma/test"
echo ""
echo "📖 For detailed instructions, see:"
echo "   - RAILWAY_DEPLOYMENT.md"
echo "   - README.md"
echo ""
echo "🔐 Security Reminder:"
echo "   Never commit .env.production with real credentials to git!"
echo ""
