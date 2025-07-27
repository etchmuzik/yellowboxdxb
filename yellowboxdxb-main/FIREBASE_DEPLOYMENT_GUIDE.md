# Firebase Hosting Deployment Guide

## Overview
This guide covers deploying the Yellow Box application to Firebase Hosting across different environments.

## Prerequisites

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Verify Project Access
```bash
firebase projects:list
```

You should see:
- `yellowbox-8e0e6` (production)
- `yellowbox-staging` (staging)  
- `yellowbox-dev` (development)

## Environment Configuration

### Development
- **Project ID**: `yellowbox-dev`
- **URL**: `https://yellowbox-dev.web.app`
- **Environment**: Development/Testing

### Staging
- **Project ID**: `yellowbox-staging`
- **URL**: `https://yellowbox-staging.web.app`
- **Environment**: Pre-production testing

### Production
- **Project ID**: `yellowbox-8e0e6`
- **URL**: `https://yellowbox-8e0e6.web.app`
- **Environment**: Live production

## Manual Deployment

### Quick Deploy (Current Environment)
```bash
# Build and deploy to current Firebase project
npm run deploy:hosting
```

### Environment-Specific Deployment
```bash
# Deploy to development
npm run deploy development

# Deploy to staging
npm run deploy staging

# Deploy to production
npm run deploy production
```

### Advanced Deployment Options
```bash
# Deploy with browser auto-open
node scripts/deploy.js production --open

# Deploy only hosting (skip functions/rules)
firebase use production
npm run build:production
firebase deploy --only hosting

# Deploy with preview channel
firebase hosting:channel:deploy preview-branch --project production
```

## Automated Deployment (GitHub Actions)

### Branch-Based Deployment
- **`develop` branch** → Development environment
- **`staging` branch** → Staging environment  
- **`main` branch** → Production environment

### Pull Request Previews
- Pull requests automatically create preview channels
- Preview URLs are posted as comments on the PR
- Previews expire after 7 days

### Setup GitHub Secrets
1. Go to your GitHub repository settings
2. Navigate to Secrets and Variables → Actions
3. Add the following secrets:

```bash
# Generate Firebase service account key
firebase projects:list
firebase service-accounts:create github-actions --project yellowbox-8e0e6
firebase service-accounts:keys:create key.json --iam-account github-actions@yellowbox-8e0e6.iam.gserviceaccount.com

# Copy the contents of key.json to GitHub secret: FIREBASE_SERVICE_ACCOUNT
```

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing
- [ ] ESLint no errors
- [ ] TypeScript compilation successful
- [ ] Build completes without warnings

### Environment Variables
- [ ] `.env.production` configured
- [ ] Firebase config updated
- [ ] Google Maps API key set
- [ ] All required secrets configured

### Firebase Configuration
- [ ] Firestore rules updated
- [ ] Storage rules updated
- [ ] Security rules tested
- [ ] Indexes configured

### Performance
- [ ] Bundle size acceptable (<2MB)
- [ ] Images optimized
- [ ] Lazy loading implemented
- [ ] Service worker configured

## Post-Deployment Verification

### Automated Checks
```bash
# Check deployment status
firebase hosting:sites:list

# View recent deployments
firebase hosting:releases:list

# Check site health
curl -I https://yellowbox-8e0e6.web.app

# Check custom domain (if configured)
curl -I https://yellowboxdxb.com
```

### Custom Domain Status
```bash
# Run DNS status check
./scripts/check-dns-status.sh

# Check Firebase domain configuration
firebase hosting:sites:get yellowbox-8e0e6 --project yellowbox-8e0e6
```

### Manual Testing
1. **Authentication Flow**
   - Login/logout functionality
   - Role-based access control
   - Session persistence

2. **Core Features**
   - Rider management
   - Expense tracking
   - Document upload
   - Real-time tracking

3. **Performance**
   - Page load times
   - API response times
   - Mobile responsiveness

## Rollback Procedures

### Quick Rollback
```bash
# List recent releases
firebase hosting:releases:list --project production

# Rollback to previous release
firebase hosting:rollback --project production
```

### Specific Version Rollback
```bash
# Deploy specific version
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

## Monitoring & Alerts

### Firebase Console
- Monitor hosting metrics
- View error logs
- Check performance data

### Custom Monitoring
```javascript
// Add to your app
import { getPerformance } from 'firebase/performance';
const perf = getPerformance();

// Monitor custom metrics
const trace = perf.trace('page_load');
trace.start();
// ... page load logic
trace.stop();
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install --force
   npm run build
   ```

2. **Permission Errors**
   ```bash
   # Re-authenticate
   firebase logout
   firebase login
   ```

3. **Environment Variables Not Loading**
   - Check `.env` file naming
   - Verify Vite environment variable prefix (`VITE_`)
   - Restart development server

4. **Firebase Rules Errors**
   ```bash
   # Test rules locally
   firebase emulators:start
   # Deploy rules separately
   firebase deploy --only firestore:rules
   ```

### Debug Commands
```bash
# View detailed logs
firebase hosting:channel:list --project production

# Check current project
firebase use

# Validate firebase.json
firebase init hosting --project production

# Test locally
npm run build
firebase serve --project production
```

## Security Best Practices

### Pre-Deployment Security
- [ ] No hardcoded secrets in code
- [ ] Environment variables properly configured
- [ ] Firebase security rules tested
- [ ] HTTPS enforced
- [ ] CSP headers configured

### Post-Deployment Security
- [ ] Monitor for security alerts
- [ ] Regular dependency updates
- [ ] Access logs reviewed
- [ ] User permissions audited

## Performance Optimization

### Build Optimization
```javascript
// vite.config.ts optimizations already configured
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
        }
      }
    }
  }
}
```

### Runtime Optimization
- Lazy loading implemented
- Code splitting configured
- Service worker enabled
- CDN caching optimized

## Support & Documentation

### Resources
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [GitHub Actions for Firebase](https://github.com/FirebaseExtended/action-hosting-deploy)
- [Yellow Box Project Documentation](./README.md)

### Getting Help
1. Check Firebase Console for errors
2. Review GitHub Actions logs
3. Check project documentation
4. Contact development team

---

**Last Updated**: January 2025
**Version**: 1.0.0