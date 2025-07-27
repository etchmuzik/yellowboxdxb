#!/bin/bash

# Quick start script for MCP server development

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Yellow Box MCP Server - Development Setup${NC}"
echo "=========================================="

# Check if Redis is running
echo -e "${YELLOW}Checking Redis...${NC}"
if ! redis-cli ping > /dev/null 2>&1; then
    echo -e "${YELLOW}Redis not running. Starting Redis...${NC}"
    
    # Try Docker first
    if command -v docker &> /dev/null; then
        docker run -d --name yellowbox-redis -p 6379:6379 redis:alpine > /dev/null 2>&1 || true
        sleep 2
    else
        echo -e "${RED}Redis is not running and Docker is not available${NC}"
        echo "Please install Redis or Docker to continue"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Redis is running${NC}"

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Please configure .env file with your Firebase credentials${NC}"
    echo "Opening .env file..."
    ${EDITOR:-nano} .env
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
fi

# Create logs directory
mkdir -p logs

# Start the server
echo -e "${GREEN}Starting MCP server...${NC}"
echo ""
npm run dev