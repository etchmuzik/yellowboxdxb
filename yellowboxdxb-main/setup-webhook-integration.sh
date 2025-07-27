#!/bin/bash

# Yellow Box N8N Webhook Integration Setup Script
# This script sets up the complete webhook integration for real-time data sync

set -e

echo "🚀 Yellow Box N8N Webhook Integration Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if N8N is installed
check_n8n() {
    print_status "Checking N8N installation..."
    
    if command -v n8n &> /dev/null; then
        print_success "N8N is installed"
        return 0
    else
        print_warning "N8N is not installed globally"
        return 1
    fi
}

# Install N8N if not present
install_n8n() {
    print_status "Installing N8N globally..."
    
    if npm install -g n8n; then
        print_success "N8N installed successfully"
    else
        print_error "Failed to install N8N"
        exit 1
    fi
}

# Check if N8N is running
check_n8n_running() {
    print_status "Checking if N8N is running..."
    
    if curl -s http://localhost:5678/healthz > /dev/null 2>&1; then
        print_success "N8N is running on localhost:5678"
        return 0
    else
        print_warning "N8N is not running"
        return 1
    fi
}

# Start N8N in background
start_n8n() {
    print_status "Starting N8N in background..."
    
    # Create N8N data directory if it doesn't exist
    mkdir -p ~/.n8n
    
    # Start N8N in background
    nohup n8n start > ~/.n8n/n8n.log 2>&1 &
    N8N_PID=$!
    
    print_status "N8N started with PID: $N8N_PID"
    print_status "Waiting for N8N to be ready..."
    
    # Wait for N8N to start (max 60 seconds)
    for i in {1..60}; do
        if curl -s http://localhost:5678/healthz > /dev/null 2>&1; then
            print_success "N8N is ready!"
            return 0
        fi
        sleep 1
        echo -n "."
    done
    
    print_error "N8N failed to start within 60 seconds"
    return 1
}

# Import N8N workflows
import_workflows() {
    print_status "Importing N8N workflows..."
    
    if [ -d "n8n-workflows" ]; then
        print_status "Found n8n-workflows directory"
        
        # Count workflow files
        WORKFLOW_COUNT=$(find n8n-workflows -name "*.json" | wc -l)
        print_status "Found $WORKFLOW_COUNT workflow files"
        
        if [ $WORKFLOW_COUNT -gt 0 ]; then
            print_success "Workflows are ready for import"
            print_status "Please import workflows manually through N8N UI:"
            print_status "1. Open http://localhost:5678"
            print_status "2. Go to Workflows"
            print_status "3. Click 'Import from File'"
            print_status "4. Import each JSON file from n8n-workflows/ directory"
        else
            print_warning "No workflow files found in n8n-workflows directory"
        fi
    else
        print_warning "n8n-workflows directory not found"
        print_status "Workflows need to be created manually in N8N"
    fi
}

# Test webhook connectivity
test_webhook() {
    print_status "Testing webhook connectivity..."
    
    if [ -f "test-webhook-connection.js" ]; then
        print_status "Running webhook connectivity test..."
        
        if node test-webhook-connection.js; then
            print_success "Webhook connectivity test completed"
        else
            print_warning "Webhook test had some issues - check the output above"
        fi
    else
        print_warning "Webhook test script not found"
    fi
}

# Update Firebase Functions
setup_firebase_functions() {
    print_status "Setting up Firebase Functions for webhook integration..."
    
    if [ -d "functions" ]; then
        cd functions
        
        # Check if package.json exists
        if [ -f "package.json" ]; then
            print_status "Installing Firebase Functions dependencies..."
            npm install axios
            
            print_success "Firebase Functions dependencies installed"
        else
            print_warning "Firebase Functions package.json not found"
        fi
        
        cd ..
    else
        print_warning "Firebase Functions directory not found"
    fi
}

# Create environment configuration
create_env_config() {
    print_status "Creating environment configuration..."
    
    # Create .env.automation if it doesn't exist
    if [ ! -f ".env.automation" ]; then
        cat > .env.automation << EOF
# N8N Webhook Configuration
N8N_WEBHOOK_URL=http://localhost:5678/webhook/yellowbox-sync
N8N_HOST=localhost
N8N_PORT=5678

# Enable webhook integration
ENABLE_WEBHOOK_SYNC=true

# Webhook timeout (milliseconds)
WEBHOOK_TIMEOUT=10000

# Batch sync settings
BATCH_SYNC_ENABLED=true
BATCH_SYNC_SIZE=10
BATCH_SYNC_DELAY=1000
EOF
        print_success "Created .env.automation file"
    else
        print_status ".env.automation already exists"
    fi
}

# Display setup summary
display_summary() {
    echo ""
    echo "=========================================="
    echo "🎉 Webhook Integration Setup Complete!"
    echo "=========================================="
    echo ""
    echo "📋 Next Steps:"
    echo "1. Open N8N: http://localhost:5678"
    echo "2. Import workflows from n8n-workflows/ directory"
    echo "3. Configure Google Sheets credentials in N8N"
    echo "4. Activate all workflows"
    echo "5. Test the integration using: npm run test-webhook"
    echo ""
    echo "📁 Files Created/Updated:"
    echo "• src/services/webhookService.ts - Webhook service"
    echo "• functions/src/webhooks.js - Firebase Functions"
    echo "• test-webhook-connection.js - Test script"
    echo "• src/components/admin/WebhookTestPanel.tsx - Test UI"
    echo "• .env.automation - Environment config"
    echo ""
    echo "🔧 Useful Commands:"
    echo "• npm run test-webhook - Test webhook connectivity"
    echo "• firebase deploy --only functions - Deploy Firebase Functions"
    echo "• n8n start - Start N8N manually"
    echo ""
    echo "📖 Documentation:"
    echo "• N8N_AUTOMATION_SETUP.md - Complete setup guide"
    echo "• Webhook URL: http://localhost:5678/webhook/yellowbox-sync"
    echo ""
}

# Main execution
main() {
    print_status "Starting webhook integration setup..."
    
    # Check and install N8N if needed
    if ! check_n8n; then
        install_n8n
    fi
    
    # Start N8N if not running
    if ! check_n8n_running; then
        start_n8n
    fi
    
    # Setup Firebase Functions
    setup_firebase_functions
    
    # Create environment configuration
    create_env_config
    
    # Import workflows (manual step)
    import_workflows
    
    # Wait a moment for everything to settle
    sleep 2
    
    # Test webhook connectivity
    test_webhook
    
    # Display summary
    display_summary
}

# Handle script interruption
trap 'print_error "Setup interrupted"; exit 1' INT TERM

# Run main function
main

print_success "Webhook integration setup completed successfully!"