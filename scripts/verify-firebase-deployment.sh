#!/bin/bash

echo "🔍 Yellow Box Firebase Deployment Verification"
echo "=============================================="

# Check current directory
echo "📁 Current directory: $(pwd)"
echo ""

# Check for project directories
echo "📂 Available project directories:"
ls -la | grep yellowbox
echo ""

# Check yellowboxdxb-main structure
if [ -d "yellowboxdxb-main" ]; then
    echo "✅ yellowboxdxb-main directory found"
    echo "📋 Contents:"
    ls -la yellowboxdxb-main/ | head -10
    echo ""
    
    # Check for key files
    echo "🔍 Checking for key files in yellowboxdxb-main:"
    
    if [ -f "yellowboxdxb-main/package.json" ]; then
        echo "✅ package.json found"
    else
        echo "❌ package.json missing"
    fi
    
    if [ -f "yellowboxdxb-main/firebase.json" ]; then
        echo "✅ firebase.json found"
    else
        echo "❌ firebase.json missing"
    fi
    
    if [ -f "yellowboxdxb-main/.firebaserc" ]; then
        echo "✅ .firebaserc found"
    else
        echo "❌ .firebaserc missing"
    fi
    
    if [ -d "yellowboxdxb-main/src" ]; then
        echo "✅ src directory found"
    else
        echo "❌ src directory missing"
    fi
    
    if [ -d "yellowboxdxb-main/dist" ]; then
        echo "✅ dist directory found (built)"
    else
        echo "⚠️  dist directory missing (needs build)"
    fi
    
    echo ""
else
    echo "❌ yellowboxdxb-main directory not found"
fi

# Check Firebase CLI
echo "🔧 Firebase CLI Status:"
if command -v firebase &> /dev/null; then
    echo "✅ Firebase CLI installed: $(firebase --version)"
    
    # Check login status
    if firebase projects:list &> /dev/null; then
        echo "✅ Firebase CLI authenticated"
        echo "📋 Available projects:"
        firebase projects:list | grep yellowbox
    else
        echo "❌ Firebase CLI not authenticated - run 'firebase login'"
    fi
else
    echo "❌ Firebase CLI not installed - run 'npm install -g firebase-tools'"
fi

echo ""
echo "🚀 Deployment Commands:"
echo "To deploy from yellowboxdxb-main:"
echo "  cd yellowboxdxb-main"
echo "  npm run build"
echo "  firebase deploy --only hosting"
echo ""
echo "Or use the deployment script:"
echo "  cd yellowboxdxb-main"
echo "  npm run deploy production"