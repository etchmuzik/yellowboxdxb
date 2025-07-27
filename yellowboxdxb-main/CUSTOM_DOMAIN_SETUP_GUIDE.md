# Custom Domain Setup Guide - yellowboxdxb.com

## Current Status
🔄 **Domain Verification in Progress**

Firebase is requesting you to remove the following DNS record to verify domain ownership:

```
Record Type: A
Domain: yellowboxdxb.com
Value: 185.158.133.1
```

## Step-by-Step Setup Process

### 1. Remove Current DNS Record
**Action Required**: Go to your DNS provider and remove the A record:
- **Type**: A
- **Name**: @ (or yellowboxdxb.com)
- **Value**: 185.158.133.1

### 2. Wait for DNS Propagation
After removing the record:
- Wait 5-10 minutes for DNS changes to propagate
- You can check DNS propagation at: https://dnschecker.org

### 3. Verify Domain in Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/project/yellowbox-8e0e6/hosting/main)
2. Navigate to Hosting → Custom domains
3. Click "Verify" next to yellowboxdxb.com
4. Firebase should confirm domain ownership

### 4. Add Firebase DNS Records
Once verified, Firebase will provide you with DNS records to add:

**Expected Records** (Firebase will provide exact values):
```
Type: A
Name: yellowboxdxb.com (or @)
Value: [Firebase IP addresses - usually multiple]

Type: A  
Name: www
Value: [Firebase IP addresses - usually multiple]
```

### 5. Configure DNS at Your Provider
Add the Firebase-provided A records to your DNS settings:

#### For Most DNS Providers:
1. Log into your domain registrar/DNS provider
2. Go to DNS management
3. Add the A records provided by Firebase
4. Save changes

#### Common DNS Providers:
- **Cloudflare**: DNS → Records → Add record
- **GoDaddy**: DNS Management → Add Record
- **Namecheap**: Advanced DNS → Add New Record
- **Google Domains**: DNS → Custom records

### 6. SSL Certificate Setup
Firebase automatically provisions SSL certificates once DNS is configured:
- This process can take 24-48 hours
- You'll see "Provisioning" status in Firebase Console
- Once complete, your site will be available at https://yellowboxdxb.com

## Verification Commands

### Check Current DNS Status
```bash
# Check current A records
dig yellowboxdxb.com A

# Check if the old record is removed
nslookup yellowboxdxb.com

# Check DNS propagation
dig @8.8.8.8 yellowboxdxb.com A
```

### Firebase Domain Status
```bash
# Check Firebase hosting status
firebase hosting:sites:list --project yellowbox-8e0e6

# Check domain configuration
firebase hosting:sites:get yellowbox-8e0e6 --project yellowbox-8e0e6
```

## Troubleshooting

### If Domain Verification Fails
1. **Double-check DNS removal**: Ensure the A record (185.158.133.1) is completely removed
2. **Clear DNS cache**: 
   ```bash
   # On macOS
   sudo dscacheutil -flushcache
   
   # On Windows
   ipconfig /flushdns
   ```
3. **Wait longer**: DNS propagation can take up to 24 hours
4. **Check with multiple DNS checkers**: Use different tools to verify removal

### If SSL Certificate Fails
1. **Verify DNS records**: Ensure Firebase A records are correctly added
2. **Check domain status**: Look for any errors in Firebase Console
3. **Wait**: SSL provisioning can take 24-48 hours
4. **Contact Firebase Support**: If issues persist after 48 hours

## Expected Timeline

| Step | Duration | Status |
|------|----------|---------|
| Remove DNS record | Immediate | ⏳ In Progress |
| DNS propagation | 5-60 minutes | ⏳ Pending |
| Domain verification | 1-5 minutes | ⏳ Pending |
| Add Firebase DNS | Immediate | ⏳ Pending |
| DNS propagation | 5-60 minutes | ⏳ Pending |
| SSL certificate | 24-48 hours | ⏳ Pending |

## Post-Setup Verification

Once complete, verify your setup:

```bash
# Test HTTP redirect to HTTPS
curl -I http://yellowboxdxb.com

# Test HTTPS access
curl -I https://yellowboxdxb.com

# Test www redirect
curl -I https://www.yellowboxdxb.com
```

## Firebase Console Links

- **Project Console**: https://console.firebase.google.com/project/yellowbox-8e0e6
- **Hosting Dashboard**: https://console.firebase.google.com/project/yellowbox-8e0e6/hosting/main
- **Custom Domains**: https://console.firebase.google.com/project/yellowbox-8e0e6/hosting/main/custom-domains

## Next Steps After Domain Setup

1. **Update Environment Variables**: Update any hardcoded URLs in your app
2. **Update Social Media Links**: Update any external references
3. **Set up Redirects**: Configure any necessary URL redirects
4. **Update Documentation**: Update all documentation with new domain
5. **Test All Features**: Ensure all functionality works with custom domain

## Support

If you encounter issues:
1. Check Firebase Console for error messages
2. Verify DNS settings with your provider
3. Use online DNS checking tools
4. Contact Firebase Support if needed

---

**Last Updated**: January 2025
**Domain**: yellowboxdxb.com
**Firebase Project**: yellowbox-8e0e6