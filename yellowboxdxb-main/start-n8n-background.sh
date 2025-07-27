#!/bin/bash

# Start n8n in background for Yellow Box automation
# This script starts n8n as a background process

set -e

echo "🚀 Starting n8n in background for Yellow Box..."

# Check if n8n is already running
if curl -s http://localhost:5678/healthz > /dev/null 2>&1; then
    echo "✅ n8n is already running at http://localhost:5678"
    exit 0
fi

# Check if n8n is installed
if ! command -v n8n &> /dev/null; then
    echo "❌ n8n is not installed. Run ./install-n8n.sh first"
    exit 1
fi

# Set environment variables
export N8N_BASIC_AUTH_ACTIVE=false
export N8N_HOST=localhost
export N8N_PORT=5678
export N8N_PROTOCOL=http
export WEBHOOK_URL=http://localhost:5678/

# Create logs directory
mkdir -p logs

# Start n8n in background
echo "Starting n8n in background..."
nohup n8n start > logs/n8n.log 2>&1 &
N8N_PID=$!

# Wait for n8n to start
echo "Waiting for n8n to start..."
for i in {1..30}; do
    if curl -s http://localhost:5678/healthz > /dev/null 2>&1; then
        echo "✅ n8n started successfully at http://localhost:5678"
        echo "📝 Process ID: $N8N_PID"
        echo "📋 Logs: logs/n8n.log"
        echo ""
        echo "To stop n8n: kill $N8N_PID"
        echo "To view logs: tail -f logs/n8n.log"
        exit 0
    fi
    sleep 2
done

echo "❌ n8n failed to start within 60 seconds"
echo "Check logs: cat logs/n8n.log"
exit 1