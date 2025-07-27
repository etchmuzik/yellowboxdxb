#!/bin/bash

# Firebase Deployment Verification Script
# Verifies that the Firebase Hosting setup is ready for deployment

set -e

echo "🔍 Verifying Firebase Hosting setup for Yellow Box..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it:"
    echo "    npm install -g firebase-tools"
    exit 1
else
    echo "✅ Firebase CLI is installed"
fi

# Check if user is logged in
echo "🔐 Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run:"
    echo "    firebase login"
    exit 1
else
    echo "✅ Firebase authentication verified"
fi

# Check if project exists
echo "📋 Checking project configuration..."
if [ -f "firebase.json" ]; then
    echo "✅ firebase.json found"
else
    echo "❌ firebase.json not found"
    exit 1
fi

if [ -f "firestore.rules" ]; then
    echo "✅ firestore.rules found"
else
    echo "❌ firestore.rules not found"
    exit 1
fi

if [ -f "storage.rules" ]; then
    echo "✅ storage.rules found"
else
    echo "❌ storage.rules not found"
    exit 1
fi

echo ""
echo "🎉 Firebase Hosting setup verification completed successfully!"
echo ""
echo "📋 Ready to deploy with these commands:"
echo "   npm run deploy:hosting      # Deploy to production"
echo "   npm run deploy:staging      # Deploy to staging channel"
echo "   npm run deploy:preview      # Deploy to preview channel"
echo ""
echo "🌐 Your app will be available at:"
echo "   https://yellowbox-8e0e6.web.app"
echo "   https://yellowbox-8e0e6.firebaseapp.com"