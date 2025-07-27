# Yellow Box Production Setup Guide

This guide will walk you through setting up Yellow Box for production deployment.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Firebase CLI installed (`npm install -g firebase-tools`)
- Git installed
- Access to Firebase Console
- Access to Google Cloud Console

## Step 1: Firebase Project Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Name it (e.g., "yellowbox-production")
4. Enable Google Analytics (optional but recommended)
5. Wait for project creation to complete

### 1.2 Enable Firebase Services

In Firebase Console, enable:

1. **Authentication**
   - Go to Authentication > Sign-in method
   - Enable Email/Password provider
   - Add authorized domains

2. **Firestore Database**
   - Go to Firestore Database
   - Click "Create database"
   - Choose production mode
   - Select closest region to Dubai (e.g., `europe-west1`)

3. **Storage**
   - Go to Storage
   - Click "Get started"
   - Choose production mode
   - Use same region as Firestore

4. **Hosting**
   - Go to Hosting
   - Click "Get started"
   - Follow setup instructions (we'll deploy later)

### 1.3 Configure Firebase Settings

1. Go to Project Settings > General
2. Add web app
3. Name it "Yellow Box Web"
4. Copy the configuration values

## Step 2: Google Cloud Setup

### 2.1 Enable Required APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your Firebase project
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API

### 2.2 Create API Keys

1. Go to APIs & Services > Credentials
2. Create API key for Google Maps
3. Add restrictions:
   - Application restrictions: HTTP referrers
   - Add your domains:
     - `https://yourdomain.com/*`
     - `https://your-project.web.app/*`
     - `https://your-project.firebaseapp.com/*`
   - API restrictions: Select the APIs you enabled

### 2.3 Create Service Account (for CI/CD)

1. Go to IAM & Admin > Service Accounts
2. Create service account
3. Grant roles:
   - Firebase Admin
   - Cloud Datastore User
   - Firebase Rules Admin
4. Create key (JSON format)
5. Download and store securely

## Step 3: Local Setup

### 3.1 Clone Repository

```bash
git clone https://github.com/your-org/yellowbox.git
cd yellowbox
```

### 3.2 Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 3.3 Configure Environment

1. Copy environment template:
   ```bash
   cp .env.example .env.production
   ```

2. Edit `.env.production` with your values:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key
   ```

### 3.4 Firebase CLI Setup

1. Login to Firebase:
   ```bash
   firebase login
   ```

2. Select project:
   ```bash
   firebase use your-project-id
   ```

## Step 4: Security Configuration

### 4.1 Deploy Security Rules

1. Copy production rules:
   ```bash
   cp firestore.rules.production firestore.rules
   ```

2. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### 4.2 Deploy Indexes

1. Copy production indexes:
   ```bash
   cp firestore.indexes.production.json firestore.indexes.json
   ```

2. Deploy indexes:
   ```bash
   firebase deploy --only firestore:indexes
   ```

### 4.3 Deploy Storage Rules

```bash
firebase deploy --only storage
```

## Step 5: Initial Data Setup

### 5.1 Create Admin User

1. Temporarily enable bootstrap mode in Firestore rules
2. Run the setup script:
   ```bash
   npm run setup:admin
   ```
3. Disable bootstrap mode and redeploy rules

### 5.2 Configure System Settings

Add initial configuration documents in Firestore:

```javascript
// In Firestore Console or via script
// Collection: system_config

// Document: general
{
  "appName": "Yellow Box",
  "currency": "AED",
  "timezone": "Asia/Dubai",
  "maintenanceMode": false
}

// Document: expense_categories
{
  "categories": [
    "Fuel",
    "Bike Service",
    "Salik",
    "RTA Fine",
    "Insurance",
    "Other"
  ]
}
```

## Step 6: Deployment

### 6.1 Build Application

```bash
npm run build
```

### 6.2 Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

Your app will be available at:
- `https://your-project.web.app`
- `https://your-project.firebaseapp.com`

### 6.3 Configure Custom Domain (Optional)

1. In Firebase Console > Hosting
2. Click "Add custom domain"
3. Follow verification steps
4. Update DNS records as instructed

## Step 7: CI/CD Setup (GitHub Actions)

### 7.1 Add GitHub Secrets

In your GitHub repository settings, add these secrets:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_GOOGLE_MAPS_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT` (base64 encoded service account JSON)
- `FIREBASE_TOKEN` (from `firebase login:ci`)

### 7.2 Enable GitHub Actions

1. Push workflow files to repository
2. GitHub Actions will automatically run on push to main branch

## Step 8: Monitoring Setup

### 8.1 Firebase Monitoring

1. Go to Firebase Console > Performance
2. Verify performance data is being collected
3. Set up alerts for performance issues

### 8.2 Error Tracking (Optional - Sentry)

1. Create account at [Sentry.io](https://sentry.io)
2. Create new project
3. Get DSN
4. Add to `.env.production`:
   ```env
   VITE_SENTRY_DSN=your_sentry_dsn
   VITE_SENTRY_ENVIRONMENT=production
   ```

### 8.3 Analytics

1. Go to Firebase Console > Analytics
2. Verify events are being tracked
3. Create custom dashboards as needed

## Step 9: Post-Deployment

### 9.1 Verify Deployment

Run through the verification checklist:

1. ✅ Can access the application
2. ✅ Can log in with admin account
3. ✅ All pages load without errors
4. ✅ Can perform CRUD operations
5. ✅ Security rules are working
6. ✅ Maps functionality works

### 9.2 Set Up Backups

1. Enable Firestore backups:
   ```bash
   gcloud firestore backups schedules create \
     --database=default \
     --recurrence=weekly \
     --retention=30d
   ```

### 9.3 Configure Alerts

Set up monitoring alerts for:
- High error rates
- Performance degradation
- Security rule violations
- Quota limits

## Troubleshooting

### Common Issues

1. **CORS errors with Google Maps**
   - Verify API key restrictions
   - Check allowed domains

2. **Firebase permission denied**
   - Check security rules
   - Verify user roles

3. **Build failures**
   - Clear node_modules and reinstall
   - Check for TypeScript errors

4. **Deployment failures**
   - Verify Firebase CLI is logged in
   - Check project permissions

## Support

For issues or questions:
- Check logs in Firebase Console
- Review browser console for errors
- Contact technical support

---

Remember to keep this guide updated as the deployment process evolves!