# Setting Up yellowboxdxb.com Custom Domain

## 🌐 Steps to Connect Your Domain to Firebase Hosting

### Step 1: Add Custom Domain in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/project/yellowbox-8e0e6/hosting/sites)
2. Click on your site `yellowbox-8e0e6`
3. Click on "Add custom domain" button
4. Enter `yellowboxdxb.com` and click Continue
5. Also add `www.yellowboxdxb.com` as a second domain

### Step 2: Verify Domain Ownership

Firebase will provide you with a TXT record to add to your DNS:

**Example TXT Record:**
```
Type: TXT
Host: @ (or yellowboxdxb.com)
Value: google-site-verification=XXXXXXXXXX
```

Add this record in your domain registrar's DNS settings and click "Verify" in Firebase.

### Step 3: Update DNS A Records

After verification, Firebase will provide A records. Add these to your DNS:

**For yellowboxdxb.com (apex domain):**
```
Type: A
Host: @ (or blank)
Value: 151.101.1.195
TTL: 3600

Type: A
Host: @ (or blank)
Value: 151.101.65.195
TTL: 3600
```

**For www.yellowboxdxb.com:**
```
Type: CNAME
Host: www
Value: yellowbox-8e0e6.web.app
TTL: 3600
```

### Step 4: Wait for SSL Certificate

- Firebase will automatically provision SSL certificates
- This can take 24-48 hours after DNS propagation
- Your site will show "Setting up SSL" during this time

### Step 5: Update Firebase Configuration (Optional)

If you want to redirect all traffic to the apex domain, update `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "redirects": [
      {
        "source": "https://www.yellowboxdxb.com/**",
        "destination": "https://yellowboxdxb.com/:splat",
        "type": 301
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules"
  }
}
```

## 📋 DNS Provider Quick Guides

### GoDaddy
1. Log in to GoDaddy
2. Go to "My Products" → "DNS"
3. Add the records above
4. Save changes

### Namecheap
1. Log in to Namecheap
2. Go to "Domain List" → "Manage" → "Advanced DNS"
3. Add new records
4. Save changes

### Cloudflare
1. Log in to Cloudflare
2. Select your domain
3. Go to "DNS" tab
4. Add records (set Proxy status to "DNS only" initially)
5. Save

### Google Domains
1. Log in to Google Domains
2. Select your domain
3. Go to "DNS" → "Manage custom records"
4. Add the records
5. Save

## ⏱️ Timeline

1. **DNS Propagation**: 5 minutes to 48 hours (usually within 1 hour)
2. **SSL Certificate**: 24-48 hours after DNS verification
3. **Total Setup Time**: Usually complete within 48 hours

## 🔍 How to Check Progress

### Check DNS Propagation:
```bash
# Check A records
dig yellowboxdxb.com

# Check CNAME
dig www.yellowboxdxb.com

# Check from Google's DNS
dig @8.8.8.8 yellowboxdxb.com
```

### Check SSL Status:
```bash
# Check SSL certificate
openssl s_client -connect yellowboxdxb.com:443 -servername yellowboxdxb.com
```

## 🚨 Troubleshooting

### Domain Not Working After 48 Hours:
1. Verify DNS records are correct
2. Check Firebase Console for any errors
3. Clear browser cache and try incognito mode
4. Check if domain is active and not expired

### SSL Certificate Issues:
1. Ensure DNS is properly configured
2. Wait full 48 hours
3. Contact Firebase support if still not working

### Mixed Content Warnings:
1. Ensure all resources use HTTPS
2. Update any hardcoded HTTP URLs to HTTPS
3. Check Google Maps API calls use HTTPS

## 📞 Support

- **Firebase Support**: https://firebase.google.com/support
- **Domain Registrar Support**: Contact your domain provider

## ✅ Final Checklist

- [ ] Added yellowboxdxb.com in Firebase Console
- [ ] Added www.yellowboxdxb.com in Firebase Console
- [ ] Verified domain ownership with TXT record
- [ ] Added A records for apex domain
- [ ] Added CNAME record for www subdomain
- [ ] Waited for DNS propagation
- [ ] SSL certificate provisioned
- [ ] Site accessible at https://yellowboxdxb.com
- [ ] Site accessible at https://www.yellowboxdxb.com
- [ ] Redirects working properly (if configured)

---

**Note**: The app is already deployed and ready. You just need to complete the DNS configuration on your domain registrar's side!