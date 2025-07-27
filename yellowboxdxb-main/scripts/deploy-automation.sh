#!/bin/bash

# Yellow Box - n8n Automation Deployment Script
# This script helps deploy and configure n8n automation workflows

set -e

echo "🚀 Yellow Box - n8n Automation Deployment"
echo "=========================================="

# Configuration
N8N_VERSION="latest"
WORKFLOWS_DIR="./n8n-workflows"
BACKUP_DIR="./backups"
CONFIG_FILE="./n8n-config.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        log_error "Node.js version 16 or higher is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    log_info "Prerequisites check passed ✓"
    log_info "Node.js version: $(node --version)"
    log_info "npm version: $(npm --version)"
}

# Install n8n
install_n8n() {
    log_step "Installing n8n..."
    
    if command -v n8n &> /dev/null; then
        CURRENT_VERSION=$(n8n --version 2>/dev/null || echo "unknown")
        log_warn "n8n is already installed (version: $CURRENT_VERSION)"
        
        read -p "Do you want to update n8n to the latest version? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            npm install -g n8n@${N8N_VERSION}
            log_info "n8n updated successfully ✓"
        else
            log_info "Skipping n8n installation"
            return
        fi
    else
        npm install -g n8n@${N8N_VERSION}
        
        if [ $? -eq 0 ]; then
            log_info "n8n installed successfully ✓"
        else
            log_error "Failed to install n8n"
            exit 1
        fi
    fi
}

# Create directories
create_directories() {
    log_step "Creating necessary directories..."
    
    mkdir -p ${WORKFLOWS_DIR}
    mkdir -p ${BACKUP_DIR}
    mkdir -p ./credentials
    
    log_info "Directories created ✓"
}

# Create configuration file
create_config() {
    log_step "Creating configuration template..."
    
    cat > ${CONFIG_FILE} << EOF
{
  "yellowbox": {
    "firebase": {
      "projectId": "yellowbox-8e0e6",
      "apiKey": "YOUR_FIREBASE_API_KEY",
      "authDomain": "yellowbox-8e0e6.firebaseapp.com",
      "databaseURL": "https://yellowbox-8e0e6-default-rtdb.firebaseio.com",
      "storageBucket": "yellowbox-8e0e6.appspot.com"
    },
    "googleSheets": {
      "spreadsheetId": "YOUR_GOOGLE_SHEET_ID",
      "serviceAccountEmail": "YOUR_SERVICE_ACCOUNT_EMAIL"
    },
    "app": {
      "url": "https://yellowbox-8e0e6.web.app",
      "webhookUrl": "http://localhost:5678/webhook/yellowbox-sync"
    },
    "workflows": {
      "realTimeSync": "e91V8Vqp3fxl80PS",
      "scheduledBackup": "mpchfdzgAVmAVlVU",
      "healthMonitoring": "yz8EHQamhw1mb8Sx",
      "dataIntegrityCheck": "LGoTcdR0z8xMHYSW"
    }
  }
}
EOF
    
    log_info "Configuration template created: ${CONFIG_FILE}"
}

# Create workflow import script
create_import_script() {
    log_step "Creating workflow import helper script..."
    
    cat > ./import-workflows.sh << 'EOF'
#!/bin/bash

# Yellow Box - Workflow Import Helper
echo "🔄 Importing Yellow Box Workflows"
echo "================================="

# Check if n8n is running
if ! pgrep -f "n8n" > /dev/null; then
    echo "❌ n8n is not running. Please start n8n first."
    exit 1
fi

echo "📋 Complete workflow files are ready for import:"
echo ""
echo "1. Real-time Data Sync:"
echo "   File: n8n-workflows/real-time-data-sync.json"
echo "   Purpose: Instant sync of data changes to Google Sheets"
echo ""
echo "2. Scheduled Data Backup:"
echo "   File: n8n-workflows/scheduled-data-backup.json"
echo "   Purpose: Regular backup every 6 hours"
echo ""
echo "3. Health Monitoring:"
echo "   File: n8n-workflows/health-monitoring.json"
echo "   Purpose: Monitor app health every 15 minutes"
echo ""
echo "4. Data Integrity Check:"
echo "   File: n8n-workflows/data-integrity-check.json"
echo "   Purpose: Daily data validation at midnight"
echo ""
echo "📖 Import Instructions:"
echo "1. Open n8n at http://localhost:5678"
echo "2. Go to 'Workflows' tab"
echo "3. Click 'Import from file'"
echo "4. Select each JSON file from the n8n-workflows/ directory"
echo "5. Configure credentials for each workflow:"
echo "   - Replace YOUR_GOOGLE_SHEET_ID with your actual Sheet ID"
echo "   - Set Google Sheets credential to 'YellowBox Google Sheets'"
echo "   - Configure Firebase/Google API credentials"
echo "6. Test each workflow before activating"
echo ""
echo "🔧 Configuration Required:"
echo "- Google Sheets ID: Replace YOUR_GOOGLE_SHEET_ID"
echo "- Google Sheets Credential: YellowBox Google Sheets"
echo "- Firebase Project: yellowbox-8e0e6 (already set)"
echo "- EmailJS credentials (for alerts)"
echo ""
echo "📚 For detailed setup instructions, see:"
echo "   - CREDENTIAL_SETUP_GUIDE.md"
echo "   - N8N_AUTOMATION_SETUP.md"
EOF
    
    chmod +x ./import-workflows.sh
    log_info "Import helper script created: ./import-workflows.sh"
}

# Create credential setup helper
create_credential_helper() {
    log_step "Creating credential setup helper..."
    
    cat > ./setup-credentials.sh << 'EOF'
#!/bin/bash

# Yellow Box - Credential Setup Helper
echo "🔐 Yellow Box Credential Setup Helper"
echo "====================================="

echo ""
echo "This helper will guide you through setting up credentials."
echo "Make sure you have completed the following steps first:"
echo ""
echo "✅ Created Google Cloud project"
echo "✅ Enabled Google Sheets API"
echo "✅ Created service account and downloaded JSON key"
echo "✅ Created Google Spreadsheet with required tabs"
echo "✅ Shared spreadsheet with service account"
echo "✅ Downloaded Firebase Admin SDK key"
echo ""

read -p "Have you completed all the above steps? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please complete the prerequisite steps first."
    echo "See CREDENTIAL_SETUP_GUIDE.md for detailed instructions."
    exit 1
fi

echo ""
echo "📋 Information needed for configuration:"
echo ""

# Collect Google Sheets information
echo "1. Google Sheets Setup:"
read -p "   Enter your Google Sheet ID: " SHEET_ID
read -p "   Enter your service account email: " SERVICE_EMAIL

# Collect Firebase information
echo ""
echo "2. Firebase Setup:"
read -p "   Enter your Firebase project ID [yellowbox-8e0e6]: " FIREBASE_PROJECT
FIREBASE_PROJECT=${FIREBASE_PROJECT:-yellowbox-8e0e6}

# Collect app information
echo ""
echo "3. Application Setup:"
read -p "   Enter your app URL [https://yellowbox-8e0e6.web.app]: " APP_URL
APP_URL=${APP_URL:-https://yellowbox-8e0e6.web.app}

# Update configuration file
echo ""
echo "📝 Updating configuration..."

# Create updated config
cat > ./n8n-config-updated.json << EOF
{
  "yellowbox": {
    "firebase": {
      "projectId": "$FIREBASE_PROJECT",
      "authDomain": "$FIREBASE_PROJECT.firebaseapp.com",
      "databaseURL": "https://$FIREBASE_PROJECT-default-rtdb.firebaseio.com",
      "storageBucket": "$FIREBASE_PROJECT.appspot.com"
    },
    "googleSheets": {
      "spreadsheetId": "$SHEET_ID",
      "serviceAccountEmail": "$SERVICE_EMAIL"
    },
    "app": {
      "url": "$APP_URL",
      "webhookUrl": "http://localhost:5678/webhook/yellowbox-sync"
    },
    "workflows": {
      "realTimeSync": "e91V8Vqp3fxl80PS",
      "scheduledBackup": "mpchfdzgAVmAVlVU",
      "healthMonitoring": "yz8EHQamhw1mb8Sx",
      "dataIntegrityCheck": "LGoTcdR0z8xMHYSW"
    }
  }
}
EOF

echo "✅ Configuration updated: ./n8n-config-updated.json"
echo ""
echo "🔄 Next steps:"
echo "1. Open n8n at http://localhost:5678"
echo "2. Go to 'Credentials' and add:"
echo "   - Google Sheets API credential (upload your service account JSON)"
echo "   - Firebase Admin credential (upload your Firebase Admin SDK JSON)"
echo "3. Import workflows using ./import-workflows.sh"
echo "4. Update workflow parameters with your configuration values"
echo "5. Test each workflow before activating"
echo ""
echo "📚 For detailed instructions, see CREDENTIAL_SETUP_GUIDE.md"
EOF
    
    chmod +x ./setup-credentials.sh
    log_info "Credential setup helper created: ./setup-credentials.sh"
}

# Start n8n
start_n8n() {
    log_step "Starting n8n..."
    
    # Check if n8n is already running
    if pgrep -f "n8n" > /dev/null; then
        log_warn "n8n is already running"
        log_info "Access n8n at: http://localhost:5678"
        return
    fi
    
    # Start n8n in background
    log_info "Starting n8n server..."
    nohup n8n start > n8n.log 2>&1 &
    
    # Wait for n8n to start
    log_info "Waiting for n8n to initialize..."
    sleep 15
    
    # Check if n8n started successfully
    if pgrep -f "n8n" > /dev/null; then
        log_info "n8n started successfully ✓"
        log_info "Access n8n at: http://localhost:5678"
        
        # Try to check if n8n is responding
        if command -v curl &> /dev/null; then
            sleep 5
            if curl -s http://localhost:5678 > /dev/null; then
                log_info "n8n is responding to requests ✓"
            else
                log_warn "n8n may still be starting up. Please wait a moment."
            fi
        fi
    else
        log_error "Failed to start n8n"
        log_error "Check n8n.log for error details"
        exit 1
    fi
}

# Create monitoring script
create_monitoring_script() {
    log_step "Creating monitoring script..."
    
    cat > ./monitor-workflows.sh << 'EOF'
#!/bin/bash

# Yellow Box - Workflow Monitoring Script
echo "📊 Yellow Box Workflow Monitoring"
echo "================================="

# Check if n8n is running
if ! pgrep -f "n8n" > /dev/null; then
    echo "❌ n8n is not running"
    exit 1
fi

echo "✅ n8n is running (PID: $(pgrep -f "n8n"))"
echo ""

# Check n8n log for recent activity
if [ -f "n8n.log" ]; then
    echo "📋 Recent n8n activity (last 10 lines):"
    echo "----------------------------------------"
    tail -10 n8n.log
    echo ""
fi

echo "🔗 Quick Links:"
echo "- n8n Interface: http://localhost:5678"
echo "- Workflow Executions: http://localhost:5678/executions"
echo "- Credentials: http://localhost:5678/credentials"
echo ""

echo "📈 Workflow Status:"
echo "- Check execution history in n8n interface"
echo "- Monitor Google Sheets for data updates"
echo "- Review logs for any errors"
echo ""

echo "🛠️ Troubleshooting:"
echo "- If workflows aren't running, check they are activated"
echo "- Verify credentials are properly configured"
echo "- Check Google Sheets permissions"
echo "- Review Firebase security rules"
EOF
    
    chmod +x ./monitor-workflows.sh
    log_info "Monitoring script created: ./monitor-workflows.sh"
}

# Display next steps
show_next_steps() {
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo "====================================="
    echo ""
    echo "📋 What was created:"
    echo "✅ n8n installed and started"
    echo "✅ Configuration template: ${CONFIG_FILE}"
    echo "✅ Helper scripts created"
    echo "✅ Directory structure set up"
    echo ""
    echo "🔄 Next Steps (in order):"
    echo ""
    echo "1. 🌐 Access n8n Interface:"
    echo "   Open: http://localhost:5678"
    echo "   Set up your n8n account (first time only)"
    echo ""
    echo "2. 🔐 Set up Credentials:"
    echo "   Run: ./setup-credentials.sh"
    echo "   Follow the prompts to configure your credentials"
    echo ""
    echo "3. 📥 Import Workflows:"
    echo "   Run: ./import-workflows.sh"
    echo "   This will show you the workflow IDs to import"
    echo ""
    echo "4. ⚙️ Configure Workflows:"
    echo "   Update each workflow with your specific values"
    echo "   Test each workflow before activating"
    echo ""
    echo "5. 🚀 Activate Workflows:"
    echo "   Toggle the 'Active' switch for each workflow"
    echo "   Monitor execution logs for any issues"
    echo ""
    echo "📚 Documentation:"
    echo "- Detailed Setup: ./CREDENTIAL_SETUP_GUIDE.md"
    echo "- Automation Overview: ./N8N_AUTOMATION_SETUP.md"
    echo "- Summary: ./AUTOMATION_SUMMARY.md"
    echo ""
    echo "🔧 Helper Scripts:"
    echo "- ./setup-credentials.sh - Configure credentials"
    echo "- ./import-workflows.sh - Import workflow guide"
    echo "- ./monitor-workflows.sh - Monitor workflow status"
    echo ""
    echo "🆔 Workflow IDs:"
    echo "- Real-time Data Sync: e91V8Vqp3fxl80PS"
    echo "- Scheduled Data Backup: mpchfdzgAVmAVlVU"
    echo "- Health Monitoring: yz8EHQamhw1mb8Sx"
    echo "- Data Integrity Check: LGoTcdR0z8xMHYSW"
    echo ""
    echo "🎯 Quick Start:"
    echo "1. Run: ./setup-credentials.sh"
    echo "2. Open: http://localhost:5678"
    echo "3. Import workflows and configure credentials"
    echo "4. Test and activate workflows"
    echo ""
    echo "Need help? Check the documentation files or n8n.log for errors."
}

# Main execution
main() {
    echo "Starting Yellow Box n8n automation deployment..."
    echo ""
    
    check_prerequisites
    install_n8n
    create_directories
    create_config
    create_import_script
    create_credential_helper
    create_monitoring_script
    start_n8n
    show_next_steps
}

# Handle script interruption
trap 'echo -e "\n❌ Deployment interrupted"; exit 1' INT

# Run main function
main