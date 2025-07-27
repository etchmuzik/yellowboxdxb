#!/bin/bash

# Yellow Box - Tmux Orchestrator Startup Script
# This script sets up the complete automation development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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

log_header() {
    echo -e "${PURPLE}$1${NC}"
}

# Display header
display_header() {
    clear
    log_header "🚀 Yellow Box - Automation Environment Startup"
    log_header "=============================================="
    echo ""
    log_info "Setting up complete development and automation environment"
    log_info "Using Tmux-Orchestrator for session management"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking prerequisites..."
    
    # Check if tmux is installed
    if ! command -v tmux &> /dev/null; then
        log_error "tmux is not installed. Please install tmux first."
        echo "  macOS: brew install tmux"
        echo "  Ubuntu: sudo apt-get install tmux"
        exit 1
    fi
    
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
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        log_error "Please run this script from the Yellow Box project root directory"
        exit 1
    fi
    
    log_info "Prerequisites check passed ✓"
}

# Install Tmux-Orchestrator if not present
install_tmux_orchestrator() {
    log_step "Checking Tmux-Orchestrator installation..."
    
    if ! command -v tmux-orchestrator &> /dev/null; then
        log_warn "Tmux-Orchestrator not found. Installing..."
        
        # Clone and install Tmux-Orchestrator
        if [ ! -d "/tmp/tmux-orchestrator" ]; then
            git clone https://github.com/Jedward23/Tmux-Orchestrator.git /tmp/tmux-orchestrator
        fi
        
        cd /tmp/tmux-orchestrator
        
        # Install based on available package manager
        if command -v cargo &> /dev/null; then
            log_info "Installing with Cargo..."
            cargo install --path .
        elif [ -f "install.sh" ]; then
            log_info "Running install script..."
            chmod +x install.sh
            ./install.sh
        else
            log_error "Unable to install Tmux-Orchestrator. Please install manually."
            exit 1
        fi
        
        cd - > /dev/null
        
        if command -v tmux-orchestrator &> /dev/null; then
            log_info "Tmux-Orchestrator installed successfully ✓"
        else
            log_error "Tmux-Orchestrator installation failed"
            exit 1
        fi
    else
        log_info "Tmux-Orchestrator is already installed ✓"
    fi
}

# Setup project dependencies
setup_dependencies() {
    log_step "Setting up project dependencies..."
    
    # Install npm dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing npm dependencies..."
        npm install
    fi
    
    # Install n8n globally if not present
    if ! command -v n8n &> /dev/null; then
        log_info "Installing n8n globally..."
        npm install -g n8n
    fi
    
    # Check Firebase CLI
    if ! command -v firebase &> /dev/null; then
        log_info "Installing Firebase CLI..."
        npm install -g firebase-tools
    fi
    
    log_info "Dependencies setup completed ✓"
}

# Create necessary directories and files
setup_environment() {
    log_step "Setting up environment..."
    
    # Create directories
    mkdir -p n8n-workflows
    mkdir -p backups
    mkdir -p credentials
    mkdir -p logs
    
    # Make scripts executable
    chmod +x scripts/*.sh 2>/dev/null || true
    chmod +x *.sh 2>/dev/null || true
    
    # Create log files if they don't exist
    touch n8n.log
    touch automation.log
    
    log_info "Environment setup completed ✓"
}

# Validate tmux configuration
validate_tmux_config() {
    log_step "Validating tmux configuration..."
    
    if [ ! -f "tmux-orchestrator-config.yaml" ]; then
        log_error "tmux-orchestrator-config.yaml not found!"
        exit 1
    fi
    
    # Test configuration syntax
    if command -v tmux-orchestrator &> /dev/null; then
        if tmux-orchestrator --config tmux-orchestrator-config.yaml --validate 2>/dev/null; then
            log_info "Tmux configuration is valid ✓"
        else
            log_warn "Tmux configuration validation failed, but continuing..."
        fi
    fi
}

# Start the tmux session
start_tmux_session() {
    log_step "Starting Yellow Box automation environment..."
    
    # Kill existing session if it exists
    tmux kill-session -t yellowbox-automation 2>/dev/null || true
    
    echo ""
    log_info "🎯 Starting comprehensive automation environment..."
    log_info "📊 This will create a multi-pane tmux session with:"
    echo "   • Main dashboard and system monitor"
    echo "   • n8n automation server and logs"
    echo "   • Firebase development tools"
    echo "   • Google Sheets integration setup"
    echo "   • Development and testing environment"
    echo "   • Automation workflow management"
    echo ""
    log_info "🔗 Quick access:"
    echo "   • n8n Interface: http://localhost:5678"
    echo "   • Use hotkeys (Prefix + M/N/F/D/A) to navigate"
    echo "   • Custom commands: setup, import, monitor, deploy, status"
    echo ""
    
    read -p "Press Enter to start the automation environment..."
    
    # Start tmux session with orchestrator
    if command -v tmux-orchestrator &> /dev/null; then
        tmux-orchestrator --config tmux-orchestrator-config.yaml
    else
        log_error "Tmux-Orchestrator not available. Starting basic tmux session..."
        start_basic_tmux_session
    fi
}

# Fallback basic tmux session
start_basic_tmux_session() {
    log_info "Starting basic tmux session..."
    
    # Create new session
    tmux new-session -d -s yellowbox-automation -n main
    
    # Split into panes
    tmux split-window -h -t yellowbox-automation:main
    tmux split-window -v -t yellowbox-automation:main.1
    
    # Setup panes
    tmux send-keys -t yellowbox-automation:main.0 'clear && echo "🎯 Yellow Box Automation Dashboard" && echo "=================================" && echo "" && echo "📊 System ready for automation setup!" && echo "" && echo "Commands:" && echo "- ./setup-credentials.sh" && echo "- ./import-workflows.sh" && echo "- ./monitor-workflows.sh"' Enter
    
    tmux send-keys -t yellowbox-automation:main.1 'clear && echo "🤖 n8n Server" && echo "=============" && sleep 2 && n8n start' Enter
    
    tmux send-keys -t yellowbox-automation:main.2 'clear && echo "📊 System Monitor" && watch -n 5 "date && echo && ps aux | grep -E \"(n8n|node)\" | grep -v grep"' Enter
    
    # Create additional windows
    tmux new-window -t yellowbox-automation -n automation
    tmux send-keys -t yellowbox-automation:automation 'clear && echo "🔄 Automation Management" && echo "=======================" && echo "" && echo "Workflow IDs:" && echo "- Real-time Sync: e91V8Vqp3fxl80PS" && echo "- Scheduled Backup: mpchfdzgAVmAVlVU" && echo "- Health Monitor: yz8EHQamhw1mb8Sx" && echo "- Data Integrity: LGoTcdR0z8xMHYSW"' Enter
    
    # Attach to session
    tmux attach-session -t yellowbox-automation
}

# Display completion message
show_completion() {
    echo ""
    log_header "🎉 Yellow Box Automation Environment Started!"
    log_header "============================================"
    echo ""
    log_info "Your comprehensive automation environment is now running!"
    echo ""
    log_info "🔗 Access Points:"
    echo "   • n8n Interface: http://localhost:5678"
    echo "   • Firebase Console: https://console.firebase.google.com/project/yellowbox-8e0e6"
    echo ""
    log_info "📋 Next Steps:"
    echo "   1. Configure credentials: run 'setup' command in tmux"
    echo "   2. Import workflows: run 'import' command"
    echo "   3. Monitor system: run 'monitor' command"
    echo ""
    log_info "🎯 Tmux Navigation:"
    echo "   • Prefix + M: Main dashboard"
    echo "   • Prefix + N: n8n automation"
    echo "   • Prefix + F: Firebase services"
    echo "   • Prefix + D: Data management"
    echo "   • Prefix + A: Automation management"
    echo ""
    log_info "📚 Documentation available in project files"
    echo ""
}

# Main execution
main() {
    display_header
    check_prerequisites
    install_tmux_orchestrator
    setup_dependencies
    setup_environment
    validate_tmux_config
    start_tmux_session
    show_completion
}

# Handle script interruption
trap 'echo -e "\n❌ Setup interrupted"; exit 1' INT

# Check if running in tmux already
if [ -n "$TMUX" ]; then
    log_error "Already running inside tmux. Please exit tmux first."
    exit 1
fi

# Run main function
main "$@"