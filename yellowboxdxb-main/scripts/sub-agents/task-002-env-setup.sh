#\!/bin/bash

# Sub-Agent 2: Production Environment Setup
echo "[$(date)] Sub-Agent-2: Starting production environment setup..." >> logs/task-002.log

# Check for .env.production file
if [ \! -f .env.production ]; then
    echo "Creating .env.production file..."
    cp .env.example .env.production
    
    # Update with production values
    cat > .env.production << 'ENVEOF'
# Firebase Configuration (Production)
VITE_FIREBASE_API_KEY=AIzaSyBTmf13yj-iu9rzmF7HT31lF4TuQq2Fgyc
VITE_FIREBASE_AUTH_DOMAIN=yellowbox-8e0e6.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yellowbox-8e0e6
VITE_FIREBASE_STORAGE_BUCKET=yellowbox-8e0e6.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=231221635540
VITE_FIREBASE_APP_ID=1:231221635540:web:67ad3fd96034a56d8e1e52

# Google Maps API Key (Production - Restricted)
VITE_GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}

# App Configuration
VITE_APP_NAME=Yellow Box
VITE_APP_ENVIRONMENT=production
VITE_ENABLE_DEBUG=false

# API URLs
VITE_API_BASE_URL=https://yellowbox-8e0e6.web.app
VITE_FIREBASE_FUNCTIONS_URL=https://us-central1-yellowbox-8e0e6.cloudfunctions.net
ENVEOF
fi

# Create production build script
cat > scripts/build-production.sh << 'BUILDEOF'
#\!/bin/bash
echo "Building for production..."

# Clean previous builds
rm -rf dist

# Build with production config
npm run build

# Verify build
if [ -d "dist" ]; then
    echo "✓ Production build successful"
    echo "Build size: $(du -sh dist | cut -f1)"
else
    echo "✗ Build failed\!"
    exit 1
fi
BUILDEOF

chmod +x scripts/build-production.sh

echo "[$(date)] Sub-Agent-2: Environment setup completed" >> logs/task-002.log
echo "[$(date)] TASK-002: COMPLETED - Production environment configured" >> logs/task-completion.log

echo "✓ Production environment setup completed\!"
