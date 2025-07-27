# Custom Domain Setup for Yellow Box

## 🌐 Setting up yellowboxdxb.com Custom Domain

### Step 1: Firebase Console Configuration

1. **Go to Firebase Console**: https://console.firebase.google.com/project/yellowbox-8e0e6/hosting
2. **Navigate to Hosting** section
3. **Find your site**: `yellowboxdxb.web.app`
4. **Click "Add custom domain"**
5. **Enter domain**: `yellowboxdxb.com`
6. **Follow the verification process**

### Step 2: Domain Verification

Firebase will provide you with a **TXT record** for domain verification:

```
Type: TXT
Name: @ (or root domain)
Value: [Firebase will provide this - example: firebase-domain-verification=xxxxxxxxxxxxx]
```

**Add this TXT record to your DNS provider** (where you registered yellowboxdxb.com)

### Step 3: DNS Configuration

After verification, Firebase will provide **A records** for your domain:

```
Type: A
Name: @
Value: 199.36.158.100

Type: A  
Name: @
Value: 199.36.158.101
```

**Also add these A records for the www subdomain:**

```
Type: A
Name: www
Value: 199.36.158.100

Type: A
Name: www  
Value: 199.36.158.101
```

### Step 4: SSL Certificate

Firebase automatically provisions SSL certificates for custom domains. This process can take:
- **Domain verification**: 5-10 minutes
- **SSL provisioning**: 24-48 hours

### Step 5: Build and Deploy to Domain

Once DNS is configured, deploy your app:

```bash
# Build for production
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting:yellowboxdxb
```

## 🔧 Manual Setup Process

### 1. Open Firebase Console
Visit: https://console.firebase.google.com/project/yellowbox-8e0e6/hosting/sites

### 2. Add Custom Domain
- Click on your site `yellowboxdxb`
- Click "Add custom domain"
- Enter `yellowboxdxb.com`
- Complete verification steps

### 3. Update DNS Records
Add the provided records to your domain registrar's DNS settings:
- Namecheap
- GoDaddy  
- Cloudflare
- Route 53
- etc.

### 4. Wait for Propagation
- DNS propagation: 1-24 hours
- SSL certificate: 24-48 hours
- Monitor status in Firebase Console

## 🚀 Deployment Commands

```bash
# Deploy to custom domain (after DNS setup)
npm run build
firebase deploy --only hosting

# Or use the existing script
npm run deploy:hosting
```

## ✅ Verification Steps

1. **DNS Check**: Use `nslookup yellowboxdxb.com` or https://dnschecker.org
2. **SSL Check**: Visit https://yellowboxdxb.com (may show certificate warnings initially)
3. **Firebase Console**: Check hosting status for SSL provisioning progress

## 📋 Current Status

- **Site ID**: yellowboxdxb
- **Current URL**: https://yellowboxdxb.web.app ✅ Active
- **Target Domain**: yellowboxdxb.com
- **SSL**: Will be auto-provisioned by Firebase

## 🔗 Helpful Links

- [Firebase Custom Domain Guide](https://firebase.google.com/docs/hosting/custom-domain)
- [DNS Propagation Checker](https://dnschecker.org)
- [Firebase Console - Hosting](https://console.firebase.google.com/project/yellowbox-8e0e6/hosting)

## 📞 Next Steps

1. Access Firebase Console to add domain
2. Add DNS records to your domain registrar
3. Wait for propagation and SSL provisioning
4. Deploy your app to the custom domain
5. Verify everything works at https://yellowboxdxb.com