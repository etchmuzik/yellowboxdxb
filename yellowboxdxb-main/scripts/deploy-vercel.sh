#!/bin/bash

# Yellow Box Vercel Deployment Script
# Deploys to yellowboxdxb.com via Vercel

set -e

echo "🚀 Starting Yellow Box deployment to Vercel (yellowboxdxb.com)..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the yellowboxdxb-main directory"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Error: Vercel CLI not found. Install with: npm install -g vercel"
    echo "💡 Run: npm install -g vercel"
    exit 1
fi

# Login check
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

# Build the application
echo "🏗️  Building application for production..."
npm run build

echo "📋 Deployment checklist:"
echo "✅ Application built successfully"
echo "✅ vercel.json configuration ready"
echo "✅ Environment variables will be configured in Vercel dashboard"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to your Vercel dashboard: https://vercel.com/beyondtecheg-gmailcoms-projects/yellowboxdxb"
echo "2. Add your custom domain: yellowboxdxb.com"
echo "3. Configure environment variables in Vercel dashboard"
echo "4. Update DNS to point to Vercel (see instructions below)"
echo ""
echo "🌐 DNS Configuration for Vercel:"
echo "   A record: @ → 76.76.19.19"
echo "   CNAME: www → cname.vercel-dns.com"
echo ""
echo "🔧 Environment Variables to add in Vercel:"
echo "   VITE_FIREBASE_API_KEY"
echo "   VITE_FIREBASE_AUTH_DOMAIN"
echo "   VITE_FIREBASE_PROJECT_ID" 
echo "   VITE_FIREBASE_STORAGE_BUCKET"
echo "   VITE_FIREBASE_MESSAGING_SENDER_ID"
echo "   VITE_FIREBASE_APP_ID"
echo "   VITE_GOOGLE_MAPS_API_KEY"

echo "🎉 Vercel deployment successful!"