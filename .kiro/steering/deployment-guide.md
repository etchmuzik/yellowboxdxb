# Yellow Box Deployment Guide

## Overview
This guide covers the deployment process for the Yellow Box fleet management system, including environment setup, CI/CD pipelines, and production best practices.

## Deployment Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   GitHub    │────▶│ GitHub       │────▶│  Firebase   │
│   Repo      │     │ Actions      │     │  Hosting    │
└─────────────┘     └──────────────┘     └─────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  Firebase    │
                    │  Functions   │
                    └──────────────┘
```

## Environment Setup

### 1. Development Environment
```bash
# .env.development
VITE_APP_ENV=development
VITE_FIREBASE_PROJECT_ID=yellowbox-dev
VITE_GOOGLE_MAPS_API_KEY=dev-api-key
VITE_ENABLE_DEBUG=true
```

### 2. Staging Environment
```bash
# .env.staging
VITE_APP_ENV=staging
VITE_FIREBASE_PROJECT_ID=yellowbox-staging
VITE_GOOGLE_MAPS_API_KEY=staging-api-key
VITE_ENABLE_DEBUG=false
```

### 3. Production Environment
```bash
# .env.production
VITE_APP_ENV=production
VITE_FIREBASE_PROJECT_ID=yellowbox-prod
VITE_GOOGLE_MAPS_API_KEY=prod-api-key
VITE_ENABLE_DEBUG=false
```

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing
- [ ] ESLint no errors
- [ ] TypeScript no errors
- [ ] Bundle size acceptable
- [ ] No console.logs
- [ ] No hardcoded secrets

### Security
- [ ] Environment variables set
- [ ] API keys restricted
- [ ] Firebase rules updated
- [ ] CORS configured
- [ ] CSP headers set

### Performance
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Lazy loading configured
- [ ] Service worker updated
- [ ] CDN configured

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main, staging]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci --legacy-peer-deps
    
    - name: Run tests
      run: npm test -- --coverage --watchAll=false
    
    - name: Build application
      run: |
        if [ "${{ github.ref }}" == "refs/heads/main" ]; then
          npm run build
        else
          npm run build:staging
        fi
    
    - name: Deploy to Firebase
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: '${{ secrets.GITHUB_TOKEN }}'
        firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
        channelId: ${{ github.ref == 'refs/heads/main' && 'live' || 'staging' }}
        projectId: ${{ github.ref == 'refs/heads/main' && 'yellowbox-prod' || 'yellowbox-staging' }}
```

## Deployment Steps

### 1. Manual Deployment
```bash
# Build the application
npm run build

# Login to Firebase
firebase login

# Select project
firebase use production

# Deploy hosting
firebase deploy --only hosting

# Deploy functions
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules  
firebase deploy --only storage:rules
```

### 2. Automated Deployment
Push to the appropriate branch:
```bash
# Deploy to staging
git push origin develop:staging

# Deploy to production
git push origin main
```

## Firebase Configuration

### 1. Hosting Configuration
```json
// firebase.json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000"
          }
        ]
      },
      {
        "source": "**",
        "headers": [
          {
            "key": "X-Frame-Options",
            "value": "SAMEORIGIN"
          },
          {
            "key": "X-Content-Type-Options",
            "value": "nosniff"
          }
        ]
      }
    ]
  }
}
```

### 2. Functions Deployment
```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';

// Configure regional deployment
export const processExpense = functions
  .region('us-central1')
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB'
  })
  .firestore
  .document('expenses/{expenseId}')
  .onCreate(async (snap, context) => {
    // Process expense
  });
```

## Post-Deployment Tasks

### 1. Verification
```bash
# Check deployment status
firebase hosting:channel:list

# Verify functions
firebase functions:list

# Test endpoints
curl https://yellowbox-prod.web.app/api/health
```

### 2. Monitoring Setup
- Enable Firebase Performance Monitoring
- Configure Google Analytics
- Set up error tracking (Sentry)
- Configure uptime monitoring

### 3. Database Migration
```javascript
// scripts/migrate.js
const admin = require('firebase-admin');

async function migrate() {
  // Initialize admin SDK
  admin.initializeApp();
  const db = admin.firestore();
  
  // Run migrations
  const batch = db.batch();
  
  // Example: Add new field to all riders
  const riders = await db.collection('riders').get();
  riders.forEach(doc => {
    batch.update(doc.ref, {
      migrationVersion: '1.0.0',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  });
  
  await batch.commit();
  console.log('Migration completed');
}

migrate().catch(console.error);
```

## Rollback Procedures

### 1. Quick Rollback
```bash
# List recent releases
firebase hosting:releases:list

# Rollback to previous release
firebase hosting:rollback
```

### 2. Function Rollback
```bash
# List function versions
gcloud functions list

# Rollback specific function
gcloud functions deploy FUNCTION_NAME --source=gs://backup-bucket/source.zip
```

## Production Monitoring

### 1. Key Metrics
- Page load time < 3s
- API response time < 500ms
- Error rate < 0.1%
- Uptime > 99.9%

### 2. Alerts Configuration
```javascript
// monitoring/alerts.js
const alerts = [
  {
    name: 'High Error Rate',
    condition: 'error_rate > 0.01',
    channels: ['email', 'slack']
  },
  {
    name: 'Slow API Response',
    condition: 'p95_latency > 1000',
    channels: ['pagerduty']
  }
];
```

## Disaster Recovery

### 1. Backup Strategy
- Daily Firestore exports
- Storage bucket replication
- Configuration backups
- Code repository mirrors

### 2. Recovery Procedures
```bash
# Restore Firestore from backup
gcloud firestore import gs://backup-bucket/2024-01-15

# Restore Storage files
gsutil -m rsync -r gs://backup-bucket gs://production-bucket

# Restore configuration
firebase functions:config:set --data config-backup.json
```

## Security Hardening

### 1. Production Security Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Strict production rules
    match /{document=**} {
      allow read, write: if false;
    }
    
    // Specific rules for each collection
    match /users/{userId} {
      allow read: if request.auth \!= null && request.auth.uid == userId;
      allow write: if false; // Admin SDK only
    }
  }
}
```

### 2. API Security
- Rate limiting enabled
- API key restrictions
- CORS whitelist
- Request validation

## Performance Optimization

### 1. Build Optimization
```javascript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'firebase': ['firebase/app', 'firebase/auth'],
          'maps': ['@react-google-maps/api']
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
}
```

### 2. Runtime Optimization
- Enable Firestore offline persistence
- Implement aggressive caching
- Use CDN for static assets
- Enable HTTP/2 push

## Maintenance Windows

### Planning
1. Schedule during low-traffic hours
2. Notify users 48 hours in advance
3. Prepare rollback plan
4. Test on staging first

### Execution
1. Enable maintenance mode
2. Perform deployment
3. Run smoke tests
4. Monitor for issues
5. Disable maintenance mode

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node version
   - Clear npm cache
   - Verify environment variables

2. **Deployment Failures**
   - Check Firebase quota
   - Verify service account
   - Review security rules

3. **Runtime Errors**
   - Check browser console
   - Review Firebase Functions logs
   - Monitor error tracking

### Debug Commands
```bash
# View deployment logs
firebase hosting:channel:log CHANNEL_ID

# View function logs
firebase functions:log --only processExpense

# Check Firebase status
firebase projects:list

# Verify configuration
firebase functions:config:get
```
EOF < /dev/null