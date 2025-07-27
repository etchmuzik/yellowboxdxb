#!/bin/bash

# Yellow Box Staging Deployment Script
# This script handles the staging deployment process

set -e # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="Yellow Box Staging"
DEPLOY_BRANCH="develop"
FIREBASE_PROJECT="${STAGING_FIREBASE_PROJECT_ID:-yellowbox-staging}"

echo -e "${BLUE}🚧 ${PROJECT_NAME} Deployment Script${NC}"
echo "================================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print error and exit
error_exit() {
    echo -e "${RED}❌ Error: $1${NC}" >&2
    exit 1
}

# Function to print warning
warning() {
    echo -e "${YELLOW}⚠️  Warning: $1${NC}"
}

# Function to print success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Check prerequisites
echo "Checking prerequisites..."

if ! command_exists git; then
    error_exit "Git is not installed"
fi

if ! command_exists node; then
    error_exit "Node.js is not installed"
fi

if ! command_exists npm; then
    error_exit "npm is not installed"
fi

if ! command_exists firebase; then
    warning "Firebase CLI is not installed. Installing..."
    npm install -g firebase-tools
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Allow deployment from develop, staging, or feature branches
if [[ "$CURRENT_BRANCH" != "develop" && "$CURRENT_BRANCH" != "staging" && ! "$CURRENT_BRANCH" =~ ^feature/ ]]; then
    warning "Current branch '$CURRENT_BRANCH' is not a typical staging branch"
    read -p "Do you want to continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    warning "You have uncommitted changes"
    read -p "Do you want to stash them and continue? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git stash push -m "Staging deployment stash $(date +%Y%m%d-%H%M%S)"
        STASHED=true
    else
        exit 0
    fi
fi

# Pull latest changes if on develop
if [ "$CURRENT_BRANCH" == "develop" ]; then
    echo "Pulling latest changes from origin/$CURRENT_BRANCH..."
    git pull origin $CURRENT_BRANCH || warning "Failed to pull latest changes"
fi

# Install dependencies
echo "Installing dependencies..."
npm ci --legacy-peer-deps || error_exit "Failed to install dependencies"

# Run linter (allow warnings)
echo "Running linter..."
npm run lint || warning "Linting has warnings"

# Check for staging environment file
if [ ! -f ".env.staging" ]; then
    warning "Staging environment file (.env.staging) not found"
    echo "Creating from template..."
    cp .env.example .env.staging
    echo "Please update .env.staging with staging values"
fi

# Build the application
echo "Building application for staging..."
NODE_ENV=production npm run build -- --mode staging || error_exit "Build failed"

# Check build output
if [ ! -d "dist" ]; then
    error_exit "Build output directory (dist) not found"
fi

BUILD_SIZE=$(du -sh dist | cut -f1)
echo "Build size: $BUILD_SIZE"

# Deploy to Firebase Hosting (staging)
echo "Deploying to Firebase Hosting (Staging)..."
firebase deploy --only hosting --project $FIREBASE_PROJECT || error_exit "Failed to deploy to Firebase Hosting"

# Get deployment URL
DEPLOYMENT_URL="https://$FIREBASE_PROJECT.web.app"

# Generate deployment info
echo ""
echo "================================================"
success "Staging deployment completed successfully!"
echo ""
echo -e "🌐 Staging URL: ${YELLOW}$DEPLOYMENT_URL${NC}"
echo -e "📦 Build Size: ${YELLOW}$BUILD_SIZE${NC}"
echo -e "🌿 Branch: ${YELLOW}$CURRENT_BRANCH${NC}"
echo -e "📝 Commit: ${YELLOW}$(git rev-parse --short HEAD)${NC}"
echo ""

# Restore stashed changes if any
if [ "$STASHED" = true ]; then
    echo "Restoring stashed changes..."
    git stash pop
fi

# Offer to create PR if on feature branch
if [[ "$CURRENT_BRANCH" =~ ^feature/ ]]; then
    echo ""
    read -p "Would you like to create a PR to develop? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if command_exists gh; then
            gh pr create --base develop --fill
        else
            echo "GitHub CLI not installed. Please create PR manually."
        fi
    fi
fi