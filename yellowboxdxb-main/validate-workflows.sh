#!/bin/bash

# Yellow Box - Workflow Validation Script
# This script validates that all workflow files contain the expected nodes

echo "🔍 Yellow Box Workflow Validation"
echo "================================="

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
    
    local missing_files=0
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            log_info "✓ Found: $file"
        else
            log_error "✗ Missing: $file"
            missing_files=$((missing_files + 1))
        fi
    done
    
    if [ $missing_files -eq 0 ]; then
        log_info "All workflow files found ✓"
        return 0
    else
        log_error "$missing_files workflow files are missing"
        return 1
    fi
}

# Validate workflow structure
validate_workflow() {
    local file=$1
    local workflow_name=$2
    
    log_step "Validating $workflow_name..."
    
    if [ ! -f "$file" ]; then
        log_error "File not found: $file"
        return 1
    fi
    
    # Check if file is valid JSON
    if ! jq empty "$file" 2>/dev/null; then
        log_error "Invalid JSON format in $file"
        return 1
    fi
    
    # Extract workflow information
    local name=$(jq -r '.name // "Unknown"' "$file")
    local node_count=$(jq '.nodes | length' "$file")
    local connection_count=$(jq '.connections | keys | length' "$file")
    
    echo "  📋 Name: $name"
    echo "  🔗 Nodes: $node_count"
    echo "  🔄 Connections: $connection_count"
    
    # Check for required fields
    local has_nodes=$(jq 'has("nodes")' "$file")
    local has_connections=$(jq 'has("connections")' "$file")
    
    if [ "$has_nodes" = "true" ] && [ "$has_connections" = "true" ]; then
        if [ "$node_count" -gt 0 ]; then
            log_info "✓ $workflow_name is valid with $node_count nodes"
            
            # List node types
            echo "  📦 Node Types:"
            jq -r '.nodes[] | "    - \(.name) (\(.type))"' "$file"
            echo ""
            
            return 0
        else
            log_error "✗ $workflow_name has no nodes"
            return 1
        fi
    else
        log_error "✗ $workflow_name is missing required structure"
        return 1
    fi
}

# Check for placeholder values that need to be replaced
check_placeholders() {
    local file=$1
    local workflow_name=$2
    
    log_step "Checking placeholders in $workflow_name..."
    
    local placeholders=(
        "YOUR_GOOGLE_SHEET_ID"
        "YOUR_GOOGLE_SHEETS_CREDENTIAL_ID"
        "YOUR_GOOGLE_API_CREDENTIAL_ID"
        "YOUR_EMAILJS_SERVICE_ID"
        "YOUR_EMAILJS_TEMPLATE_ID"
        "YOUR_EMAILJS_USER_ID"
    )
    
    local found_placeholders=0
    
    for placeholder in "${placeholders[@]}"; do
        if grep -q "$placeholder" "$file"; then
            log_warn "⚠️  Found placeholder: $placeholder"
            found_placeholders=$((found_placeholders + 1))
        fi
    done
    
    if [ $found_placeholders -eq 0 ]; then
        log_info "✓ No placeholders found (all configured)"
    else
        log_warn "⚠️  $found_placeholders placeholders need to be configured"
    fi
    
    echo ""
}

# Main validation function
main() {
    echo ""
    log_info "Starting workflow validation..."
    echo ""
    
    # Check if jq is available
    if ! command -v jq &> /dev/null; then
        log_error "jq is required for validation. Please install jq first."
        echo "  macOS: brew install jq"
        echo "  Ubuntu: sudo apt-get install jq"
        exit 1
    fi
    
    # Check if workflow files exist
    if ! check_workflow_files; then
        log_error "Some workflow files are missing. Please run the deployment script first."
        exit 1
    fi
    
    echo ""
    
    # Validate each workflow
    local workflows=(
        "n8n-workflows/real-time-data-sync.json:Real-time Data Sync"
        "n8n-workflows/scheduled-data-backup.json:Scheduled Data Backup"
        "n8n-workflows/health-monitoring.json:Health Monitoring"
        "n8n-workflows/data-integrity-check.json:Data Integrity Check"
    )
    
    local valid_workflows=0
    local total_workflows=${#workflows[@]}
    
    for workflow in "${workflows[@]}"; do
        IFS=':' read -r file name <<< "$workflow"
        
        if validate_workflow "$file" "$name"; then
            valid_workflows=$((valid_workflows + 1))
        fi
        
        check_placeholders "$file" "$name"
    done
    
    echo ""
    log_step "Validation Summary"
    echo "=================="
    
    if [ $valid_workflows -eq $total_workflows ]; then
        log_info "🎉 All $total_workflows workflows are valid and ready for import!"
        echo ""
        echo "📋 Next Steps:"
        echo "1. Open n8n at http://localhost:5678"
        echo "2. Import each workflow file from n8n-workflows/ directory"
        echo "3. Configure credentials and replace placeholders"
        echo "4. Test each workflow before activating"
        echo ""
        echo "🔧 Configuration needed:"
        echo "- Replace YOUR_GOOGLE_SHEET_ID with your actual Google Sheet ID"
        echo "- Set up Google Sheets credentials in n8n"
        echo "- Configure Firebase/Google API credentials"
        echo "- Set up EmailJS credentials for alerts (optional)"
        echo ""
    else
        log_error "❌ $((total_workflows - valid_workflows)) out of $total_workflows workflows have issues"
        echo ""
        echo "Please check the errors above and fix the workflow files."
    fi
    
    echo "📚 For detailed setup instructions, see:"
    echo "- CREDENTIAL_SETUP_GUIDE.md"
    echo "- QUICK_START_AUTOMATION.md"
    echo ""
}

# Run validation
main "$@"