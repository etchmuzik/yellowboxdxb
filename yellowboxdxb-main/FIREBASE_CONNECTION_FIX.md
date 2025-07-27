# Fix for "Failed to load riders" Error

## Problem
The application cannot load riders because:
1. Firebase environment variables are not configured in production
2. The deployed app has no Firebase credentials
3. Firestore security rules require authentication

## Solution Steps

### Step 1: Get Firebase Configuration
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `yellowbox-8e0e6`
3. Click the gear icon → Project Settings
4. Scroll to "Your apps" → Web app
5. Copy the Firebase configuration object

### Step 2: Set Environment Variables

Create a `.env.production` file with your actual Firebase credentials:

```env
# Firebase Configuration (Required)
VITE_FIREBASE_API_KEY=AIzaSyBZvI6f6wqN0azMR0H-YdEPVJKOajdKJp4
VITE_FIREBASE_AUTH_DOMAIN=yellowbox-8e0e6.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yellowbox-8e0e6
VITE_FIREBASE_STORAGE_BUCKET=yellowbox-8e0e6.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=47222199157
VITE_FIREBASE_APP_ID=1:47222199157:web:7a5e3b808083be2d43393c

# Google Maps API Key (Required for bike tracking)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# App Configuration
VITE_APP_NAME=Yellow Box
VITE_APP_ENVIRONMENT=production
```

### Step 3: Set Environment Variables in Vercel/Hosting

If using Vercel:
1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add each variable from above
4. Redeploy the application

If using Firebase Hosting:
1. Environment variables need to be built into the app during build time
2. Use GitHub Actions or CI/CD to inject variables during build

### Step 4: Deploy Firestore Rules

```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```

### Step 5: Create Initial Admin User (One-time setup)

1. Temporarily enable bootstrap mode:
   - Edit `firestore.rules` line 27: `let ENABLE_BOOTSTRAP = true;`
   - Deploy rules: `firebase deploy --only firestore:rules`

2. Create admin user:
   - Sign up through the app
   - The first user will automatically become admin

3. Disable bootstrap mode:
   - Edit `firestore.rules` line 27: `let ENABLE_BOOTSTRAP = false;`
   - Deploy rules: `firebase deploy --only firestore:rules`

### Step 6: Rebuild and Deploy

```bash
# Build with production environment
npm run build

# Deploy to Firebase
firebase deploy --only hosting

# Or deploy to Vercel
vercel --prod
```

## Quick Test

After deployment, test the connection:
1. Open browser console
2. Check for Firebase initialization errors
3. Try logging in with the admin account
4. Verify riders load correctly

## Alternative: Direct Firebase Config (Less Secure)

If environment variables are problematic, you can hardcode the config (NOT RECOMMENDED for production):

```typescript
// src/config/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyBZvI6f6wqN0azMR0H-YdEPVJKOajdKJp4",
  authDomain: "yellowbox-8e0e6.firebaseapp.com",
  projectId: "yellowbox-8e0e6",
  storageBucket: "yellowbox-8e0e6.appspot.com",
  messagingSenderId: "47222199157",
  appId: "1:47222199157:web:7a5e3b808083be2d43393c"
};
```

## Security Notes
- Never commit `.env` files to version control
- Use environment variables in production
- Restrict API keys in Google Cloud Console
- Enable Firebase App Check for additional security