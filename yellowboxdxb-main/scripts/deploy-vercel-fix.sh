#!/bin/bash

# Vercel Deployment Script with Rollup Fix
# This script handles the npm dependency issues for Vercel deployment

set -e

echo "🚀 Starting Vercel deployment with dependency fixes..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Cleaning npm cache and node_modules..."
rm -rf node_modules package-lock.json

echo "🔧 Installing dependencies with legacy peer deps..."
npm install --legacy-peer-deps

echo "🏗️ Building the project..."
npm run build

echo "☁️ Deploying to Vercel..."
npx vercel deploy --prod

echo "✅ Deployment complete!"
echo ""
echo "🔗 Next steps:"
echo "1. Add environment variables in Vercel dashboard"
echo "2. Configure custom domain yellowboxdxb.com"
echo "3. Update DNS records"