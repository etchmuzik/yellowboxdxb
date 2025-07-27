#!/bin/bash

# Yellow Box n8n Quick Setup Script
# This script helps you quickly configure the workflows with your existing OAuth credentials

echo "🚀 Yellow Box n8n Quick Setup"
echo "=============================="
echo ""

# Check if n8n is running
echo "🔍 Checking n8n status..."
if curl -s http://localhost:5678/healthz > /dev/null; then
    echo "✅ n8n is running at http://localhost:5678"
else
    echo "❌ n8n is not running. Please start n8n first:"
    echo "   npx n8n"
    exit 1
fi

echo ""
echo "📋 Your Google OAuth Credentials:"
echo "Project ID: yellowbox-8e0e6"
echo "Client ID: 47222199157-t3nec9ls81gfuu8oav3d2gpdd9vam35f.apps.googleusercontent.com"
echo "Redirect URI: http://localhost:5678/rest/oauth2-credential/callback ✅"
echo ""

# Prompt for Google Sheet ID
echo "📊 Google Sheets Setup"
echo "======================"
echo "You need to create a Google Sheet for data storage."
echo ""
read -p "Enter your Google Sheet ID (from the URL): " SHEET_ID

if [ -z "$SHEET_ID" ]; then
    echo "❌ Google Sheet ID is required. Please create a sheet first."
    echo "   1. Go to https://sheets.google.com/"
    echo "   2. Create a new sheet named 'Yellow Box Automation Data'"
    echo "   3. Copy the ID from the URL (between /d/ and /edit)"
    exit 1
fi

echo "✅ Google Sheet ID: $SHEET_ID"
echo ""

# Prompt for EmailJS details (optional)
echo "📧 EmailJS Setup (Optional - for alerts)"
echo "========================================"
echo "If you want email alerts, set up EmailJS first at https://www.emailjs.com/"
echo ""
read -p "Enter EmailJS Service ID (or press Enter to skip): " EMAILJS_SERVICE_ID
read -p "Enter EmailJS Template ID for health alerts (or press Enter to skip): " EMAILJS_HEALTH_TEMPLATE
read -p "Enter EmailJS Template ID for integrity alerts (or press Enter to skip): " EMAILJS_INTEGRITY_TEMPLATE
read -p "Enter EmailJS User ID (or press Enter to skip): " EMAILJS_USER_ID

echo ""
echo "🔧 Configuration Summary"
echo "======================="
echo "Google Sheet ID: $SHEET_ID"
echo "Firebase Project: yellowbox-8e0e6"
echo "EmailJS Service: ${EMAILJS_SERVICE_ID:-'Not configured'}"
echo ""

read -p "Proceed with configuration? (y/N): " CONFIRM

if [[ $CONFIRM != [yY] ]]; then
    echo "❌ Configuration cancelled."
    exit 1
fi

echo ""
echo "⚙️  Updating workflow configurations..."

# Update workflows with the configuration
./configure-workflows.sh --auto \
    --sheet-id="$SHEET_ID" \
    --firebase-project="yellowbox-8e0e6" \
    --emailjs-service="$EMAILJS_SERVICE_ID" \
    --emailjs-health-template="$EMAILJS_HEALTH_TEMPLATE" \
    --emailjs-integrity-template="$EMAILJS_INTEGRITY_TEMPLATE" \
    --emailjs-user="$EMAILJS_USER_ID"

echo ""
echo "🧪 Testing webhook endpoint..."
./test-webhook.sh

echo ""
echo "✅ Quick Setup Complete!"
echo "======================="
echo ""
echo "📋 Next Steps:"
echo "1. Open n8n interface: http://localhost:5678"
echo "2. Go to Settings → Credentials"
echo "3. Add Google Sheets API credential with OAuth2:"
echo "   - Client ID: 47222199157-t3nec9ls81gfuu8oav3d2gpdd9vam35f.apps.googleusercontent.com"
echo "   - Client Secret: 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"
echo "   - Name: YellowBox Google Sheets"
echo "4. Add Google API credential with OAuth2 (same details, name: YellowBox Google API)"
echo "5. Activate all 4 Yellow Box workflows"
echo ""
echo "🔗 Webhook URL: http://localhost:5678/webhook/yellowbox-sync"
echo "📊 Google Sheet: https://docs.google.com/spreadsheets/d/$SHEET_ID/edit"
echo ""
echo "📖 For detailed instructions, see: CREDENTIAL_SETUP_GUIDE.md"