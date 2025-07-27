#!/bin/bash

# Simple Yellow Box n8n Setup Script
# This script helps you configure credentials for the Yellow Box automation workflows

set -e

echo "🚀 Yellow Box n8n Automation Setup"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if n8n is installed and running
echo "Checking n8n installation and status..."

if ! command -v n8n &> /dev/null; then
    print_warning "n8n is not installed"
    echo ""
    echo "To install n8n, choose one of these options:"
    echo ""
    echo "Option 1 - Use our installer script:"
    echo "  ./install-n8n.sh"
    echo ""
    echo "Option 2 - Install manually:"
    echo "  npm install -g n8n"
    echo "  n8n start"
    echo ""
    echo "Option 3 - Use Docker:"
    echo "  docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n"
    echo ""
    print_info "After installing, run this script again to continue setup"
    exit 0
fi

# Check if n8n is running
if curl -s http://localhost:5678/healthz > /dev/null 2>&1; then
    print_status "n8n is running and accessible"
else
    print_warning "n8n is installed but not running"
    echo ""
    echo "To start n8n, choose one of these options:"
    echo ""
    echo "Option 1 - Start in background:"
    echo "  ./start-n8n-background.sh"
    echo ""
    echo "Option 2 - Start in foreground:"
    echo "  ./install-n8n.sh"
    echo ""
    echo "Option 3 - Start manually:"
    echo "  n8n start"
    echo ""
    print_info "After starting n8n, run this script again to continue setup"
    exit 0
fi

echo ""
echo "📋 Yellow Box Workflows Status"
echo "=============================="

# Your existing OAuth credentials
GOOGLE_CLIENT_ID="1051749938157-4aqhqhqhqhqhqhqhqhqhqhqhqhqhqhqh.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abcdefghijklmnopqrstuvwxyz123456"
PROJECT_ID="yellowbox-8e0e6"

print_info "Using your existing Google OAuth credentials:"
echo "  • Project ID: $PROJECT_ID"
echo "  • Client ID: $GOOGLE_CLIENT_ID"
echo "  • Redirect URI: http://localhost:5678/rest/oauth2-credential/callback"
echo ""

echo "🔧 Next Steps for Credential Setup"
echo "=================================="
echo ""
echo "1. Open n8n in your browser:"
echo "   ${BLUE}http://localhost:5678${NC}"
echo ""
echo "2. Go to Settings > Credentials"
echo ""
echo "3. Create these credentials:"
echo ""

echo "   📊 Google Sheets API (OAuth2):"
echo "   • Name: 'Yellow Box Google Sheets'"
echo "   • Client ID: $GOOGLE_CLIENT_ID"
echo "   • Client Secret: $GOOGLE_CLIENT_SECRET"
echo "   • Scope: https://www.googleapis.com/auth/spreadsheets"
echo ""

echo "   🔥 Google Firebase (OAuth2):"
echo "   • Name: 'Yellow Box Firebase'"
echo "   • Client ID: $GOOGLE_CLIENT_ID"
echo "   • Client Secret: $GOOGLE_CLIENT_SECRET"
echo "   • Scope: https://www.googleapis.com/auth/firebase"
echo ""

echo "   📧 EmailJS (Optional - for alerts):"
echo "   • Name: 'Yellow Box EmailJS'"
echo "   • Service ID: [Your EmailJS Service ID]"
echo "   • Template ID: [Your EmailJS Template ID]"
echo "   • User ID: [Your EmailJS User ID]"
echo ""

echo "4. Create a Google Sheet for data storage:"
echo "   • Go to https://sheets.google.com"
echo "   • Create a new sheet named 'Yellow Box Data'"
echo "   • Copy the Sheet ID from the URL"
echo "   • Update the workflows with your Sheet ID"
echo ""

echo "5. Activate the workflows:"
echo "   • Yellow Box - Real-time Data Sync"
echo "   • Yellow Box - Scheduled Data Backup"
echo "   • Yellow Box - Health Monitoring"
echo "   • Yellow Box - Data Integrity Check"
echo ""

echo "🧪 Testing Your Setup"
echo "===================="
echo ""
echo "After setting up credentials, test the webhook:"
echo "  ./test-webhook.sh"
echo ""

echo "📚 Additional Resources"
echo "======================"
echo "• Full setup guide: CREDENTIAL_SETUP_GUIDE.md"
echo "• Deployment status: DEPLOYMENT_STATUS.md"
echo "• Quick start: QUICK_START_AUTOMATION.md"
echo ""

print_status "Setup guide complete! Follow the steps above to configure your credentials."
print_info "Need help? Check the documentation files or run this script again."