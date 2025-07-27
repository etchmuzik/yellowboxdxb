#!/bin/bash

# Yellow Box n8n Credential Setup Helper
# This script provides step-by-step instructions for setting up credentials in n8n

echo "🔑 Yellow Box n8n Credential Setup"
echo "=================================="
echo ""

# Check if n8n is running
echo "🔍 Checking n8n status..."
if curl -s http://localhost:5678/healthz > /dev/null 2>&1; then
    echo "✅ n8n is running at http://localhost:5678"
else
    echo "❌ n8n is not running. Please start n8n first:"
    echo "   npx n8n"
    echo "   # or"
    echo "   docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n"
    exit 1
fi

echo ""
echo "📋 Your Google OAuth Credentials (Pre-configured)"
echo "================================================="
echo "Project ID: yellowbox-8e0e6"
echo "Client ID: 47222199157-t3nec9ls81gfuu8oav3d2gpdd9vam35f.apps.googleusercontent.com"
echo "Client Secret: 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"
echo "Redirect URI: http://localhost:5678/rest/oauth2-credential/callback ✅"
echo ""

echo "🔧 Step-by-Step Credential Setup"
echo "================================"
echo ""

echo "1️⃣  GOOGLE SHEETS API CREDENTIAL"
echo "--------------------------------"
echo "1. Open n8n interface: http://localhost:5678"
echo "2. Go to Settings → Credentials"
echo "3. Click 'Add Credential'"
echo "4. Search for 'Google Sheets API'"
echo "5. Select 'OAuth2' authentication"
echo "6. Fill in:"
echo "   - Client ID: 47222199157-t3nec9ls81gfuu8oav3d2gpdd9vam35f.apps.googleusercontent.com"
echo "   - Client Secret: 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"
echo "   - Name: YellowBox Google Sheets"
echo "7. Click 'Connect my account'"
echo "8. Authorize with your Google account"
echo "9. Click 'Save'"
echo ""

read -p "Press Enter when you've completed the Google Sheets credential setup..."

echo ""
echo "2️⃣  GOOGLE API CREDENTIAL (for Firestore)"
echo "----------------------------------------"
echo "1. In n8n, click 'Add Credential' again"
echo "2. Search for 'Google API'"
echo "3. Select 'OAuth2' authentication"
echo "4. Fill in:"
echo "   - Client ID: 47222199157-t3nec9ls81gfuu8oav3d2gpdd9vam35f.apps.googleusercontent.com"
echo "   - Client Secret: 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"
echo "   - Name: YellowBox Google API"
echo "   - Scopes (add these):"
echo "     • https://www.googleapis.com/auth/datastore"
echo "     • https://www.googleapis.com/auth/firebase"
echo "     • https://www.googleapis.com/auth/cloud-platform"
echo "5. Click 'Connect my account'"
echo "6. Authorize with your Google account"
echo "7. Click 'Save'"
echo ""

read -p "Press Enter when you've completed the Google API credential setup..."

echo ""
echo "3️⃣  GOOGLE SHEET SETUP"
echo "---------------------"
echo "1. Go to https://sheets.google.com/"
echo "2. Create a new spreadsheet"
echo "3. Name it: 'Yellow Box Automation Data'"
echo "4. Create these tabs:"
echo "   - Riders"
echo "   - Expenses"
echo "   - Documents"
echo "   - Sync_Log"
echo "   - Health_Log"
echo "   - Data_Integrity_Log"
echo "   - Riders_Backup"
echo "   - Expenses_Backup"
echo "   - Documents_Backup"
echo "   - Backup_Log"
echo "5. Copy the Sheet ID from the URL (between /d/ and /edit)"
echo ""

read -p "Enter your Google Sheet ID: " SHEET_ID

if [ -z "$SHEET_ID" ]; then
    echo "❌ Sheet ID is required. Please create the sheet first."
    exit 1
fi

echo "✅ Sheet ID: $SHEET_ID"
echo ""

echo "4️⃣  EMAILJS SETUP (Optional - for alerts)"
echo "----------------------------------------"
echo "1. Go to https://www.emailjs.com/"
echo "2. Sign up or log in"
echo "3. Create a new service (Gmail, Outlook, etc.)"
echo "4. Create email templates for alerts"
echo "5. Note down your:"
echo "   - Service ID"
echo "   - Template IDs"
echo "   - User ID"
echo ""

read -p "Enter EmailJS Service ID (or press Enter to skip): " EMAILJS_SERVICE
read -p "Enter EmailJS Health Template ID (or press Enter to skip): " EMAILJS_HEALTH_TEMPLATE
read -p "Enter EmailJS Integrity Template ID (or press Enter to skip): " EMAILJS_INTEGRITY_TEMPLATE
read -p "Enter EmailJS User ID (or press Enter to skip): " EMAILJS_USER

echo ""
echo "5️⃣  UPDATING WORKFLOW CONFIGURATIONS"
echo "====================================="

# Create a configuration file
cat > workflow-config.env << EOF
# Yellow Box Workflow Configuration
GOOGLE_SHEET_ID=$SHEET_ID
FIREBASE_PROJECT_ID=yellowbox-8e0e6
GOOGLE_CLIENT_ID=47222199157-t3nec9ls81gfuu8oav3d2gpdd9vam35f.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
EMAILJS_SERVICE_ID=$EMAILJS_SERVICE
EMAILJS_HEALTH_TEMPLATE_ID=$EMAILJS_HEALTH_TEMPLATE
EMAILJS_INTEGRITY_TEMPLATE_ID=$EMAILJS_INTEGRITY_TEMPLATE
EMAILJS_USER_ID=$EMAILJS_USER
APP_URL=https://yellowbox-8e0e6.web.app
API_URL=https://yellowbox-8e0e6.web.app/api/health
EOF

echo "✅ Configuration saved to workflow-config.env"
echo ""

echo "6️⃣  FINAL STEPS"
echo "==============="
echo "1. In n8n, go to each Yellow Box workflow:"
echo "   - Yellow Box - Real-time Data Sync"
echo "   - Yellow Box - Scheduled Data Backup"
echo "   - Yellow Box - Health Monitoring"
echo "   - Yellow Box - Data Integrity Check"
echo ""
echo "2. For each workflow:"
echo "   - Open the workflow"
echo "   - Update Google Sheets nodes to use credential: 'YellowBox Google Sheets'"
echo "   - Update HTTP Request nodes to use credential: 'YellowBox Google API'"
echo "   - Replace 'YOUR_GOOGLE_SHEET_ID' with: $SHEET_ID"
echo "   - Replace EmailJS placeholders with your values (if configured)"
echo "   - Click 'Save'"
echo "   - Toggle 'Active' to enable the workflow"
echo ""

echo "🧪 TESTING"
echo "=========="
echo "Run the test script to verify everything is working:"
echo "./test-webhook.sh"
echo ""

echo "🔗 USEFUL LINKS"
echo "==============="
echo "n8n Interface: http://localhost:5678"
echo "Google Sheet: https://docs.google.com/spreadsheets/d/$SHEET_ID/edit"
echo "Webhook URL: http://localhost:5678/webhook/yellowbox-sync"
echo ""

echo "✅ Credential setup complete!"
echo "Follow the steps above to finish configuring your workflows."