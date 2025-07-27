#!/bin/bash

# Yellow Box Firebase Functions Deployment Script
# This script deploys the setUserRole function to Firebase

echo "🚀 Yellow Box Firebase Functions Deployment"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "yellowboxdxb-main/functions/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Current directory should contain yellowboxdxb-main/functions/"
    exit 1
fi

# Navigate to functions directory
echo "📁 Navigating to functions directory..."
cd yellowboxdxb-main/functions

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if logged into Firebase
echo "🔐 Checking Firebase authentication..."
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "⚠️ Not logged into Firebase. Please login:"
    firebase login
fi

# Verify project selection
echo "🎯 Checking Firebase project..."
firebase use --add

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript functions
echo "🔨 Building TypeScript functions..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix TypeScript errors and try again."
    exit 1
fi

# Deploy functions
echo "🚀 Deploying functions to Firebase..."
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS: Firebase Functions deployed successfully!"
    echo ""
    echo "📋 Deployed Functions:"
    echo "   - setUserRole (HTTPS Callable)"
    echo "     URL: https://us-central1-yellowbox-8e0e6.cloudfunctions.net/setUserRole"
    echo ""
    echo "🧪 Test the deployment:"
    echo "   firebase functions:list"
    echo ""
    echo "📊 Monitor function logs:"
    echo "   firebase functions:log --only setUserRole"
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Test role assignment from web app"
    echo "   2. Deploy MCP server (MCP_SERVER_IMPLEMENTATION_GUIDE.md)"
    echo "   3. Activate monitoring system"
else
    echo "❌ DEPLOYMENT FAILED"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   1. Check Firebase login: firebase login --reauth"
    echo "   2. Verify project: firebase use yellowbox-8e0e6"
    echo "   3. Check function logs: firebase functions:log"
    echo "   4. Review TypeScript errors: npm run build"
fi