# DNS Configuration Update for www.yellowboxdxb.com

## 🚨 Important DNS Update Required

You currently have:
```
CNAME | www.yellowboxdxb.com | yellowbox-8e0e6.web.app
```

## ✅ Correct Firebase Hosting DNS Configuration

For Firebase Hosting custom domains, you need **A records** instead of CNAME:

### Replace Your Current DNS Records With:

```
Type: A
Name: www
Value: 199.36.158.100
TTL: Auto or 3600

Type: A  
Name: www
Value: 199.36.158.101
TTL: Auto or 3600

Type: A
Name: @ (root domain)
Value: 199.36.158.100
TTL: Auto or 3600

Type: A
Name: @ (root domain)
Value: 199.36.158.101
TTL: Auto or 3600
```

## 🔄 Steps to Update

### 1. Remove Current CNAME Record
- Delete the existing CNAME record: `www.yellowboxdxb.com → yellowbox-8e0e6.web.app`

### 2. Add Firebase A Records
- Add the 4 A records listed above to your DNS provider

### 3. Add Custom Domain in Firebase Console
- Go to [Firebase Console → Hosting](https://console.firebase.google.com/project/yellowbox-8e0e6/hosting)
- Find the `yellowboxdxb` site
- Click "Add custom domain"
- Enter: `www.yellowboxdxb.com`
- Follow Firebase's verification process

## ⚠️ Why CNAME Won't Work

Firebase Hosting requires A records because:
- Firebase needs direct IP resolution for SSL certificate provisioning
- CNAME to `.web.app` domains may not work reliably for custom domains
- A records provide better performance and reliability

## 🕐 Timeline After DNS Update

- **DNS Propagation**: 5-60 minutes
- **Firebase Verification**: 15-30 minutes  
- **SSL Certificate**: Up to 24 hours
- **Full Activation**: Up to 48 hours

## 🔍 Verification Commands

Check if DNS is propagated:
```bash
dig www.yellowboxdxb.com
nslookup www.yellowboxdxb.com
```

Expected result should show:
```
www.yellowboxdxb.com. 300 IN A 199.36.158.100
www.yellowboxdxb.com. 300 IN A 199.36.158.101
```

## 📧 Firebase Console Steps

After updating DNS:
1. Visit [Firebase Console](https://console.firebase.google.com/project/yellowbox-8e0e6/hosting)
2. Find your `yellowboxdxb` hosting site
3. Click "Add custom domain"
4. Enter `www.yellowboxdxb.com`
5. Firebase will verify DNS and provision SSL certificate

## ✅ Final Result

Once complete, your Yellow Box app will be available at:
- **https://www.yellowboxdxb.com** (Primary)
- **https://yellowboxdxb.com** (Redirects to www)
- **https://yellowboxdxb.web.app** (Firebase fallback)