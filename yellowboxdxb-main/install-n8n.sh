#!/bin/bash

# Yellow Box n8n Installation and Setup Script
# This script installs n8n and starts it with the correct configuration

set -e

echo "🚀 Yellow Box n8n Installation & Setup"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first:"
    echo "   Visit: https://nodejs.org/"
    echo "   Or use Homebrew: brew install node"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
    echo "⚠️  Node.js version $NODE_VERSION detected. n8n requires Node.js 18 or higher."
    echo "   Please upgrade Node.js"
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION is compatible"

# Install n8n globally if not already installed
if ! command -v n8n &> /dev/null; then
    echo "📦 Installing n8n globally..."
    npm install -g n8n
    echo "✅ n8n installed successfully"
else
    echo "✅ n8n is already installed"
fi

# Create n8n data directory
N8N_DATA_DIR="$HOME/.n8n"
if [ ! -d "$N8N_DATA_DIR" ]; then
    mkdir -p "$N8N_DATA_DIR"
    echo "✅ Created n8n data directory: $N8N_DATA_DIR"
fi

# Set environment variables for Yellow Box
export N8N_BASIC_AUTH_ACTIVE=false
export N8N_HOST=localhost
export N8N_PORT=5678
export N8N_PROTOCOL=http
export WEBHOOK_URL=http://localhost:5678/
export N8N_EDITOR_BASE_URL=http://localhost:5678/

# Create environment file
cat > "$N8N_DATA_DIR/.env" << EOF
N8N_BASIC_AUTH_ACTIVE=false
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http
WEBHOOK_URL=http://localhost:5678/
N8N_EDITOR_BASE_URL=http://localhost:5678/
EOF

echo "✅ Environment configuration created"

# Function to check if n8n is running
check_n8n_status() {
    if curl -s http://localhost:5678/healthz > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Check if n8n is already running
if check_n8n_status; then
    echo "✅ n8n is already running at http://localhost:5678"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Open http://localhost:5678 in your browser"
    echo "2. Run the credential setup: ./setup-credentials.sh"
    echo "3. Import the Yellow Box workflows"
    exit 0
fi

echo ""
echo "🚀 Starting n8n..."
echo "   This will open n8n in your browser at http://localhost:5678"
echo "   Press Ctrl+C to stop n8n when you're done"
echo ""

# Start n8n
n8n start