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
