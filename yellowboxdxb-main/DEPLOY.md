# Yellow Box Deployment Guide

## 🚀 Quick Deploy to Firebase Hosting

### Prerequisites
- Firebase CLI installed
- Access to the Yellow Box Firebase project

### Step 1: Authenticate with Firebase
```bash
firebase login
```
This will open a browser window for you to log in with your Google account that has access to the yellowbox-8e0e6 project.

### Step 2: Deploy
```bash
# Deploy hosting only (recommended for quick updates)
firebase deploy --only hosting

# Or deploy everything (hosting + security rules)
firebase deploy
```

### Step 3: Access Your App
After successful deployment, your app will be available at:
- https://yellowbox-8e0e6.web.app
- https://yellowbox-8e0e6.firebaseapp.com

## 📦 Alternative Deployment Options

### Option 1: Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name? yellowbox
# - Directory? ./
# - Override settings? N
```

### Option 2: Deploy to Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist

# Or drag and drop the dist folder to https://app.netlify.com
```

### Option 3: Deploy to GitHub Pages
1. Create a new repository on GitHub
2. Push your code
3. Add this to package.json scripts:
```json
"deploy": "npm run build && gh-pages -d dist"
```
4. Install gh-pages: `npm install --save-dev gh-pages`
5. Run: `npm run deploy`

## 🔧 Environment Variables

For production, you might want to use environment variables instead of hardcoded Firebase config:

1. Create `.env.production`:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=yellowbox-8e0e6.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yellowbox-8e0e6
VITE_FIREBASE_STORAGE_BUCKET=yellowbox-8e0e6.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

2. Update `src/config/firebase.ts` to use env vars:
```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  // ... etc
};
```

## 📱 Post-Deployment Checklist

- [ ] Test login with all user roles
- [ ] Verify Firestore security rules are working
- [ ] Check that file uploads work (Firebase Storage)
- [ ] Test expense creation and approval flow
- [ ] Verify bike tracking functionality
- [ ] Check responsive design on mobile devices

## 🔒 Production Security

Before going live:
1. Review and tighten Firestore security rules
2. Enable App Check in Firebase Console
3. Set up monitoring and alerts
4. Configure custom domain if needed
5. Enable Firebase Performance Monitoring

## 🆘 Troubleshooting

### Build Issues
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install --legacy-peer-deps
npm run build
```

### Firebase Deploy Issues
```bash
# Check you're in the right project
firebase projects:list
firebase use yellowbox-8e0e6

# Re-authenticate
firebase login --reauth
```

### CORS Issues
Add your domain to authorized domains in Firebase Console:
- Authentication > Settings > Authorized domains

## 📊 Monitoring

After deployment, monitor your app:
- Firebase Console > Hosting (for traffic)
- Firebase Console > Firestore (for usage)
- Firebase Console > Authentication (for users)

## 🎉 Success!

Your Yellow Box fleet management system is now live! Share the URL with your team and start managing your delivery fleet efficiently.