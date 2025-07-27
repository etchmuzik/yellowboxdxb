#!/bin/bash

# Yellow Box - Workflow Configuration Script
# This script helps you configure the workflow files with your specific values

set -e

echo "🔧 Yellow Box Workflow Configuration"
echo "===================================="

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

# Check if workflow files exist
check_workflow_files() {
    log_step "Checking workflow files..."
    
    local files=(
        "n8n-workflows/real-time-data-sync.json"
        "n8n-workflows/scheduled-data-backup.json"
        "n8n-workflows/health-monitoring.json"
        "n8n-workflows/data-integrity-check.json"
    )
    
    for file in "${files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Workflow file not found: $file"
            log_error "Please run the deployment script first: ./scripts/deploy-automation.sh"
            exit 1
        fi
    done
    
    log_info "All workflow files found ✓"
}

# Collect configuration values
collect_configuration() {
    log_step "Collecting configuration values..."
    
    echo ""
    echo "Please provide the following information to configure your workflows:"
    echo ""
    
    # Google Sheets ID
    echo "1. Google Sheets Configuration:"
    echo "   Find your Google Sheet ID in the URL between /d/ and /edit"
    echo "   Example: https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit"
    read -p "   Enter your Google Sheet ID: " GOOGLE_SHEET_ID
    
    if [ -z "$GOOGLE_SHEET_ID" ]; then
        log_error "Google Sheet ID is required"
        exit 1
    fi
    
    # Firebase Project ID
    echo ""
    echo "2. Firebase Configuration:"
    read -p "   Enter your Firebase project ID [yellowbox-8e0e6]: " FIREBASE_PROJECT
    FIREBASE_PROJECT=${FIREBASE_PROJECT:-yellowbox-8e0e6}
    
    # App URL
    echo ""
    echo "3. Application URL:"
    read -p "   Enter your app URL [https://yellowbox-8e0e6.web.app]: " APP_URL
    APP_URL=${APP_URL:-https://yellowbox-8e0e6.web.app}
    
    # EmailJS Configuration (optional)
    echo ""
    echo "4. EmailJS Configuration (optional - for alerts):"
    read -p "   Enter EmailJS Service ID (or press Enter to skip): " EMAILJS_SERVICE_ID
    read -p "   Enter EmailJS Template ID (or press Enter to skip): " EMAILJS_TEMPLATE_ID
    read -p "   Enter EmailJS User ID (or press Enter to skip): " EMAILJS_USER_ID
    
    echo ""
    log_info "Configuration collected ✓"
}

# Update workflow files
update_workflow_files() {
    log_step "Updating workflow files with your configuration..."
    
    local files=(
        "n8n-workflows/real-time-data-sync.json"
        "n8n-workflows/scheduled-data-backup.json"
        "n8n-workflows/health-monitoring.json"
        "n8n-workflows/data-integrity-check.json"
    )
    
    # Create backup directory
    mkdir -p n8n-workflows/backup
    
    for file in "${files[@]}"; do
        log_info "Updating $(basename "$file")..."
        
        # Create backup
        cp "$file" "n8n-workflows/backup/$(basename "$file").backup"
        
        # Update Google Sheets ID
        sed -i.tmp "s/YOUR_GOOGLE_SHEET_ID/$GOOGLE_SHEET_ID/g" "$file"
        
        # Update Firebase project references
        sed -i.tmp "s/yellowbox-8e0e6/$FIREBASE_PROJECT/g" "$file"
        
        # Update app URL
        sed -i.tmp "s|https://yellowbox-8e0e6.web.app|$APP_URL|g" "$file"
        
        # Update EmailJS configuration if provided
        if [ ! -z "$EMAILJS_SERVICE_ID" ]; then
            sed -i.tmp "s/YOUR_EMAILJS_SERVICE_ID/$EMAILJS_SERVICE_ID/g" "$file"
        fi
        
        if [ ! -z "$EMAILJS_TEMPLATE_ID" ]; then
            sed -i.tmp "s/YOUR_EMAILJS_TEMPLATE_ID/$EMAILJS_TEMPLATE_ID/g" "$file"
        fi
        
        if [ ! -z "$EMAILJS_USER_ID" ]; then
            sed -i.tmp "s/YOUR_EMAILJS_USER_ID/$EMAILJS_USER_ID/g" "$file"
        fi
        
        # Clean up temporary files
        rm -f "$file.tmp"
    done
    
    log_info "All workflow files updated ✓"
}

# Validate updated files
validate_updated_files() {
    log_step "Validating updated workflow files..."
    
    # Check if jq is available for validation
    if command -v jq &> /dev/null; then
        local files=(
            "n8n-workflows/real-time-data-sync.json"
            "n8n-workflows/scheduled-data-backup.json"
            "n8n-workflows/health-monitoring.json"
            "n8n-workflows/data-integrity-check.json"
        )
        
        for file in "${files[@]}"; do
            if jq empty "$file" 2>/dev/null; then
                log_info "✓ $(basename "$file") is valid JSON"
            else
                log_error "✗ $(basename "$file") has invalid JSON format"
                return 1
            fi
        done
        
        log_info "All workflow files are valid ✓"
    else
        log_warn "jq not available - skipping JSON validation"
    fi
}

# Show configuration summary
show_summary() {
    echo ""
    log_step "Configuration Summary"
    echo "===================="
    echo ""
    echo "📊 Google Sheets ID: $GOOGLE_SHEET_ID"
    echo "🔥 Firebase Project: $FIREBASE_PROJECT"
    echo "🌐 App URL: $APP_URL"
    
    if [ ! -z "$EMAILJS_SERVICE_ID" ]; then
        echo "📧 EmailJS Service: $EMAILJS_SERVICE_ID"
    else
        echo "📧 EmailJS: Not configured (alerts disabled)"
    fi
    
    echo ""
    echo "📁 Updated Files:"
    echo "- n8n-workflows/real-time-data-sync.json"
    echo "- n8n-workflows/scheduled-data-backup.json"
    echo "- n8n-workflows/health-monitoring.json"
    echo "- n8n-workflows/data-integrity-check.json"
    echo ""
    echo "💾 Backups saved in: n8n-workflows/backup/"
    echo ""
}

# Show next steps
show_next_steps() {
    echo ""
    log_step "Next Steps"
    echo "=========="
    echo ""
    echo "🎯 Your workflow files are now configured and ready to import!"
    echo ""
    echo "1. 🚀 Start n8n (if not already running):"
    echo "   ./scripts/deploy-automation.sh"
    echo ""
    echo "2. 🌐 Open n8n interface:"
    echo "   http://localhost:5678"
    echo ""
    echo "3. 🔐 Set up credentials in n8n:"
    echo "   - Add Google Sheets API credential"
    echo "   - Add Google API credential for Firebase"
    echo ""
    echo "4. 📥 Import workflow files:"
    echo "   - Go to Workflows → Import from file"
    echo "   - Import each JSON file from n8n-workflows/"
    echo ""
    echo "5. 🧪 Test each workflow:"
    echo "   - Click 'Execute Workflow' to test"
    echo "   - Verify data appears in Google Sheets"
    echo ""
    echo "6. 🚀 Activate workflows:"
    echo "   - Toggle 'Active' switch for each workflow"
    echo ""
    echo "📚 Detailed instructions: N8N_IMPORT_GUIDE.md"
    echo ""
    echo "🔍 Validate workflows: ./validate-workflows.sh"
    echo "📊 Monitor workflows: ./monitor-workflows.sh"
    echo ""
}

# Main execution
main() {
    echo ""
    log_info "This script will configure your n8n workflow files with your specific values"
    echo ""
    
    check_workflow_files
    collect_configuration
    update_workflow_files
    validate_updated_files
    show_summary
    show_next_steps
    
    log_info "🎉 Workflow configuration completed successfully!"
}

# Handle script interruption
trap 'echo -e "\n❌ Configuration interrupted"; exit 1' INT

# Run main function
main "$@"