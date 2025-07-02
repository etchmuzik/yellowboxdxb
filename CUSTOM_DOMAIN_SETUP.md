# Custom Domain Setup for www.yellowboxdxb.com

## Current Status
✅ Application deployed to: https://yellowbox-8e0e6.web.app
✅ Firebase Hosting is active
✅ Firestore rules deployed
✅ Storage rules deployed

## Steps to Connect www.yellowboxdxb.com

### 1. Add Custom Domain in Firebase Console

1. Go to [Firebase Hosting](https://console.firebase.google.com/project/yellowbox-8e0e6/hosting/sites)
2. Click on your site `yellowbox-8e0e6`
3. Click "Add custom domain"
4. Enter: `www.yellowboxdxb.com`
5. Click "Continue"

### 2. Verify Domain Ownership

Firebase will provide a TXT record for verification:
- Type: `TXT`
- Host: `www` or `www.yellowboxdxb`
- Value: `firebase=VERIFICATION_CODE` (Firebase will provide this)

Add this record at your domain registrar (GoDaddy, Namecheap, etc.)

### 3. Add DNS Records

After verification, Firebase will provide A records:
- Type: `A`
- Host: `www`
- Value: `151.101.1.195`
- Value: `151.101.65.195`

Add both A records at your domain registrar.

### 4. Optional: Redirect Root Domain

To redirect yellowboxdxb.com to www.yellowboxdxb.com:
- Type: `A`
- Host: `@`
- Value: Same Firebase IPs as above

Or use your registrar's forwarding feature.

### 5. Wait for SSL Certificate

Firebase automatically provisions SSL certificates. This can take:
- 10-30 minutes for DNS propagation
- Up to 24 hours for SSL certificate

## Testing Your Deployment

While waiting for the custom domain, you can test at:
- https://yellowbox-8e0e6.web.app
- https://yellowbox-8e0e6.firebaseapp.com

## Create Initial Admin User

### Option 1: Temporary Bootstrap Mode
1. Edit `firestore.rules` line 27: `let ENABLE_BOOTSTRAP = true;`
2. Deploy rules: `firebase deploy --only firestore:rules --project yellowbox-8e0e6`
3. Visit: https://yellowbox-8e0e6.web.app/setup
4. Create admin account
5. **IMPORTANT**: Change back to `let ENABLE_BOOTSTRAP = false;`
6. Deploy rules again

### Option 2: Direct Firestore Creation
1. Go to [Firestore Console](https://console.firebase.google.com/project/yellowbox-8e0e6/firestore)
2. Create user in Authentication first
3. Add document to `users` collection with the UID

## Monitor Your Domain Status

Check status at:
https://console.firebase.google.com/project/yellowbox-8e0e6/hosting/sites

The domain will show:
- 🟡 "Needs setup" - Add DNS records
- 🟡 "Pending" - DNS propagating
- ✅ "Connected" - Domain is live!

## Troubleshooting

### Domain Not Connecting
- Verify DNS records are exactly as Firebase provided
- Check DNS propagation: https://www.whatsmydns.net/
- Wait up to 48 hours for full propagation

### SSL Certificate Issues
- Firebase handles SSL automatically
- If issues persist after 24 hours, re-add the domain

### 404 Errors
- Ensure you're using www.yellowboxdxb.com (not without www)
- Check Firebase Hosting shows the deployment