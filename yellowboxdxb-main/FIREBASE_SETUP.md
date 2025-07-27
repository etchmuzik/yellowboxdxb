# Yellow Box Firebase Setup Instructions

Your Firebase project `yellowbox-8e0e6` is already created. Follow these steps to complete the setup:

## 1. Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/project/yellowbox-8e0e6/settings/general)
2. Scroll down to "Your apps" section
3. If no web app exists, click "Add app" and choose Web (</>) icon
4. Copy the configuration values
5. Update the `.env` file with your actual values:
   - Replace `YOUR_API_KEY_HERE` with your actual API key
   - Replace `YOUR_SENDER_ID_HERE` with your messaging sender ID
   - Replace `YOUR_APP_ID_HERE` with your app ID

## 2. Enable Authentication

1. Go to [Authentication](https://console.firebase.google.com/project/yellowbox-8e0e6/authentication)
2. Click "Get started" if not already enabled
3. Enable "Email/Password" sign-in method
4. Save

## 3. Set Up Google Maps

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project or create a new one
3. Enable "Maps JavaScript API"
4. Create an API key
5. Restrict the API key to your domains
6. Add the key to `.env` file

## 4. Deploy Firebase Services

First, install Firebase CLI if you haven't:
```bash
npm install -g firebase-tools
firebase login
```

Then deploy the rules and indexes:
```bash
# Deploy everything
firebase deploy --project yellowbox-8e0e6

# Or deploy individually:
firebase deploy --only firestore:rules --project yellowbox-8e0e6
firebase deploy --only firestore:indexes --project yellowbox-8e0e6
firebase deploy --only storage:rules --project yellowbox-8e0e6
```

## 5. Create Initial Admin User

### Option A: Using Bootstrap Mode (Recommended for first setup)

1. Temporarily enable bootstrap mode in `firestore.rules`:
   - Change line 27: `let ENABLE_BOOTSTRAP = true;`
   - Deploy rules: `firebase deploy --only firestore:rules --project yellowbox-8e0e6`

2. Run the app locally:
   ```bash
   npm install --legacy-peer-deps
   npm run dev
   ```

3. Navigate to `/setup` and create your admin account

4. **IMPORTANT**: Disable bootstrap mode:
   - Change back: `let ENABLE_BOOTSTRAP = false;`
   - Deploy rules again: `firebase deploy --only firestore:rules --project yellowbox-8e0e6`

### Option B: Manual Creation in Firebase Console

1. Go to [Authentication Users](https://console.firebase.google.com/project/yellowbox-8e0e6/authentication/users)
2. Click "Add user"
3. Create a user with email/password
4. Note the User UID
5. Go to [Firestore](https://console.firebase.google.com/project/yellowbox-8e0e6/firestore)
6. Create a document in `users` collection with the User UID as document ID:
   ```json
   {
     "id": "USER_UID_HERE",
     "email": "admin@yellowbox.ae",
     "name": "Admin User",
     "role": "Admin"
   }
   ```

## 6. Test the Application

1. Ensure `.env` file has all required values
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Login with your admin credentials
4. Test key features:
   - Create a rider
   - Upload a document
   - Submit an expense
   - Check notifications

## 7. Deploy to Production

### Using GitHub Actions (Automated)
1. Push your code to GitHub
2. Set up GitHub Secrets (see DEPLOYMENT.md)
3. Push to main branch to trigger deployment

### Manual Deployment
```bash
# Build the app
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting --project yellowbox-8e0e6
```

## Current Firebase Project Status

Based on the links you provided:
- ✅ Firestore Database is active
- ✅ Storage is configured
- ✅ You have expense data in the database

## Next Steps

1. **Complete `.env` file** with your Firebase configuration
2. **Deploy security rules** for both Firestore and Storage
3. **Create admin user** using one of the methods above
4. **Test all features** to ensure proper integration

## Troubleshooting

### "Missing required environment variables" error
- Ensure all values in `.env` are filled in
- No quotes needed around the values
- Restart the dev server after changing `.env`

### Permission denied errors
- Check if rules are deployed: `firebase deploy --only firestore:rules`
- Ensure user has proper role in Firestore
- Check browser console for detailed errors

### Storage upload issues
- Deploy storage rules: `firebase deploy --only storage:rules`
- Check file size (max 10MB for documents)
- Ensure file type is image or PDF

## Support

For Firebase-specific issues:
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com/project/yellowbox-8e0e6/overview)
- Check browser console for detailed error messages