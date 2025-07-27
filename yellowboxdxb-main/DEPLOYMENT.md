# Yellow Box Deployment Guide

## Prerequisites

1. **Firebase Project**: Create a new Firebase project at https://console.firebase.google.com
2. **Google Maps API**: Enable Maps JavaScript API at https://console.cloud.google.com
3. **GitHub Repository**: Fork or clone this repository

## Initial Setup

### 1. Firebase Configuration

1. Create a new Firebase project
2. Enable Authentication with Email/Password
3. Create Firestore Database (start in production mode)
4. Enable Storage
5. Get your Firebase configuration from Project Settings

### 2. Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_actual_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key
   ```

### 3. Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable Maps JavaScript API
3. Create an API key
4. Restrict the API key to your domain(s)
5. Add the API key to your `.env` file

### 4. Firebase Security

1. **Deploy Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Deploy Firestore Indexes**:
   ```bash
   firebase deploy --only firestore:indexes
   ```

3. **Enable App Check** (optional but recommended):
   - Enable App Check in Firebase Console
   - Configure reCAPTCHA for web

### 5. Initial Admin Setup

1. **Enable Bootstrap Mode** (temporarily):
   - Edit `firestore.rules`
   - Change `let ENABLE_BOOTSTRAP = false;` to `true`
   - Deploy rules: `firebase deploy --only firestore:rules`

2. **Create Admin Account**:
   - Run the app locally: `npm run dev`
   - Go to `/setup` route
   - Create the first admin account

3. **Disable Bootstrap Mode**:
   - Change back to `let ENABLE_BOOTSTRAP = false;`
   - Deploy rules again: `firebase deploy --only firestore:rules`

## GitHub Actions Setup

### Required Secrets

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

1. **Firebase Secrets**:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_GOOGLE_MAPS_API_KEY`

2. **Deployment Secrets**:
   - `FIREBASE_SERVICE_ACCOUNT`: Download from Firebase Console → Project Settings → Service Accounts
   - `FIREBASE_TOKEN`: Run `firebase login:ci` to get this token

## Manual Deployment

### Local Build & Deploy

1. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Build the application**:
   ```bash
   npm run build
   ```

3. **Deploy to Firebase Hosting**:
   ```bash
   firebase deploy --only hosting
   ```

### Deploy Everything

```bash
firebase deploy
```

This deploys:
- Hosting (your built app)
- Firestore rules
- Firestore indexes
- Storage rules (if configured)

## Production Checklist

- [ ] All environment variables are set
- [ ] Firebase credentials are kept secret
- [ ] Google Maps API key is restricted
- [ ] Bootstrap mode is disabled in Firestore rules
- [ ] All Firestore indexes are deployed
- [ ] SSL certificate is active (automatic with Firebase Hosting)
- [ ] Custom domain is configured (optional)
- [ ] Monitoring is set up (Firebase Console)
- [ ] Backup strategy is in place
- [ ] Rate limiting is configured (via Security Rules)

## Monitoring

1. **Firebase Console**:
   - Monitor usage and costs
   - View real-time analytics
   - Check error logs

2. **Google Cloud Console**:
   - Monitor API usage
   - Set up billing alerts

3. **Application Monitoring**:
   - Activity logs in Firestore
   - Error tracking via the error service

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**:
   - Check browser console for errors
   - Ensure all variables in `.env.example` are set

2. **Permission Denied Errors**:
   - Check Firestore rules
   - Ensure user roles are properly set
   - Verify indexes are deployed

3. **Google Maps Not Loading**:
   - Check API key restrictions
   - Ensure billing is enabled
   - Verify API is enabled in Google Cloud

4. **Build Failures**:
   - Use `npm install --legacy-peer-deps`
   - Clear npm cache: `npm cache clean --force`
   - Delete `node_modules` and reinstall

## Support

For issues or questions:
- Check the [GitHub Issues](https://github.com/your-repo/issues)
- Review Firebase documentation
- Contact the development team