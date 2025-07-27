#!/bin/bash

# Yellow Box Deployment Rollback Script
# This script handles rolling back to a previous deployment

set -e # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔄 Yellow Box Deployment Rollback Script${NC}"
echo "========================================"

# Function to print error and exit
error_exit() {
    echo -e "${RED}❌ Error: $1${NC}" >&2
    exit 1
}

# Function to print success
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Check if firebase CLI is installed
if ! command -v firebase >/dev/null 2>&1; then
    error_exit "Firebase CLI is not installed. Please install it first."
fi

# Get Firebase project
read -p "Enter Firebase project ID (default: yellowbox-8e0e6): " FIREBASE_PROJECT
FIREBASE_PROJECT=${FIREBASE_PROJECT:-yellowbox-8e0e6}

# List recent releases
echo ""
echo "Fetching recent hosting releases..."
echo "===================================="

# Get hosting releases
firebase hosting:releases:list --project $FIREBASE_PROJECT --json > releases.json 2>/dev/null || error_exit "Failed to fetch releases"

# Parse and display releases
echo ""
echo "Recent releases:"
echo ""
node -e "
const releases = require('./releases.json');
if (releases && releases.releases) {
    releases.releases.slice(0, 10).forEach((release, index) => {
        const date = new Date(release.releaseTime);
        const status = release.status === 'LIVE' ? '🟢 LIVE' : '⚪ ' + release.status;
        console.log(\`\${index + 1}. \${status} - \${date.toLocaleString()} - Version: \${release.name.split('/').pop()}\`);
    });
} else {
    console.log('No releases found');
}
" || error_exit "Failed to parse releases"

# Clean up temp file
rm -f releases.json

# Get rollback choice
echo ""
read -p "Enter the number of the release to rollback to (or 'q' to quit): " CHOICE

if [ "$CHOICE" = "q" ]; then
    echo "Rollback cancelled."
    exit 0
fi

# Validate choice
if ! [[ "$CHOICE" =~ ^[0-9]+$ ]] || [ "$CHOICE" -lt 1 ] || [ "$CHOICE" -gt 10 ]; then
    error_exit "Invalid choice. Please enter a number between 1 and 10."
fi

# Get the specific release version
firebase hosting:releases:list --project $FIREBASE_PROJECT --json > releases.json 2>/dev/null
RELEASE_VERSION=$(node -e "
const releases = require('./releases.json');
const index = $CHOICE - 1;
if (releases && releases.releases && releases.releases[index]) {
    console.log(releases.releases[index].name.split('/').pop());
} else {
    process.exit(1);
}
" 2>/dev/null) || error_exit "Failed to get release version"

rm -f releases.json

# Confirm rollback
echo ""
echo -e "${YELLOW}⚠️  WARNING: You are about to rollback to version: $RELEASE_VERSION${NC}"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Rollback cancelled."
    exit 0
fi

# Perform rollback
echo ""
echo "Rolling back to version $RELEASE_VERSION..."
firebase hosting:rollback --project $FIREBASE_PROJECT --version $RELEASE_VERSION || error_exit "Failed to rollback"

# Verify rollback
echo ""
echo "Verifying rollback..."
sleep 3

# Check current live version
CURRENT_VERSION=$(firebase hosting:releases:list --project $FIREBASE_PROJECT --json 2>/dev/null | node -e "
const releases = require('/dev/stdin');
const liveRelease = releases.releases.find(r => r.status === 'LIVE');
if (liveRelease) {
    console.log(liveRelease.name.split('/').pop());
}
" 2>/dev/null)

if [ "$CURRENT_VERSION" = "$RELEASE_VERSION" ]; then
    success "Rollback completed successfully!"
    echo ""
    echo -e "🌐 Live URL: ${BLUE}https://$FIREBASE_PROJECT.web.app${NC}"
    echo -e "📌 Version: ${BLUE}$CURRENT_VERSION${NC}"
    
    # Log rollback
    echo ""
    echo "Creating rollback log..."
    cat > "rollback-$(date +%Y%m%d-%H%M%S).log" << EOF
Yellow Box Deployment Rollback Log
=================================
Date: $(date)
Rolled back to: $RELEASE_VERSION
Firebase Project: $FIREBASE_PROJECT
Performed by: $(whoami)
Reason: Manual rollback
EOF
    
    echo "Rollback log created."
else
    error_exit "Rollback verification failed. Please check Firebase Console."
fi

# Notify about additional steps
echo ""
echo -e "${YELLOW}📋 Post-rollback checklist:${NC}"
echo "1. ✓ Verify the application is working correctly"
echo "2. ✓ Check error logs for any issues"
echo "3. ✓ Notify the team about the rollback"
echo "4. ✓ Create an incident report if this was due to a production issue"
echo "5. ✓ Plan fixes for the issues that caused the rollback"