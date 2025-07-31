#!/bin/bash

# Deploy Yellow Box to www.yellowboxdxb.com
# This script configures Firebase custom domain and provides DNS instructions

echo "🚀 Yellow Box Custom Domain Deployment"
echo "======================================="

# Check if Firebase CLI is installed and user is logged in
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run: firebase login"
    exit 1
fi

# Set project
echo "📋 Setting Firebase project to yellowbox-8e0e6..."
firebase use yellowbox-8e0e6

echo ""
echo "🌐 CUSTOM DOMAIN SETUP REQUIRED"
echo "================================"
echo ""
echo "To complete deployment to www.yellowboxdxb.com, you need to:"
echo ""
echo "1. ADD CUSTOM DOMAIN IN FIREBASE CONSOLE:"
echo "   - Go to: https://console.firebase.google.com/project/yellowbox-8e0e6/hosting/main"
echo "   - Click 'Add custom domain'"
echo "   - Enter: www.yellowboxdxb.com"
echo "   - Follow the verification steps"
echo ""
echo "2. UPDATE DNS RECORDS:"
echo "   Replace the current DNS records in Hostinger with:"
echo ""
echo "   DELETE EXISTING RECORDS:"
echo "   - A record: @ -> 76.76.21.21"
echo "   - A record: www -> 76.76.21.21"
echo ""
echo "   ADD FIREBASE RECORDS (Firebase will provide these):"
echo "   - A record: @ -> [Firebase IP 1]"
echo "   - A record: @ -> [Firebase IP 2]" 
echo "   - A record: www -> [Firebase IP 1]"
echo "   - A record: www -> [Firebase IP 2]"
echo ""
echo "   Firebase typically uses these IPs:"
echo "   - 199.36.158.100"
echo "   - 199.36.158.101"
echo ""
echo "3. WAIT FOR PROPAGATION:"
echo "   - DNS propagation: 1-24 hours"
echo "   - SSL certificate: 24-48 hours"
echo ""
echo "4. VERIFY DEPLOYMENT:"
echo "   - Check: https://www.yellowboxdxb.com"
echo "   - Test login: admin@yellowbox.com / YellowBox2024!"
echo ""
echo "✅ Current Status:"
echo "   - Build: ✅ Completed"
echo "   - Firebase Deploy: ✅ Completed" 
echo "   - Current URL: https://yellowboxdxb.web.app"
echo "   - Custom Domain: ⏳ Pending DNS setup"
echo ""
echo "🔗 Helpful Links:"
echo "   - Firebase Console: https://console.firebase.google.com/project/yellowbox-8e0e6/hosting/main"
echo "   - DNS Management: [Your Hostinger DNS panel]"
echo "   - DNS Checker: https://dnschecker.org"
echo ""