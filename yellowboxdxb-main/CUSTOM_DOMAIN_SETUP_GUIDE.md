# 🌐 Custom Domain Setup Guide - www.yellowboxdxb.com

## 📋 **Overview**
Setting up www.yellowboxdxb.com to point to your Firebase Hosting project (yellowbox-8e0e6.web.app).

## 🎯 **Required DNS Changes**

### ✅ **Step 1: ADD New CNAME Record**
```
Record Type: CNAME
Name: www (or www.yellowboxdxb.com)
Value: yellowbox-8e0e6.web.app
TTL: 300 (or Auto)
```

### ❌ **Step 2: REMOVE Old CNAME Record**
```
Record Type: CNAME
Name: www (or www.yellowboxdxb.com) 
Value: yellowboxdxb.com
```

## 🔧 **DNS Provider Instructions**

### For Cloudflare:
1. Login to Cloudflare dashboard
2. Select your domain: yellowboxdxb.com
3. Go to DNS > Records
4. **Delete** existing CNAME record: www → yellowboxdxb.com
5. **Add** new CNAME record: www → yellowbox-8e0e6.web.app
6. Set Proxy status to "DNS only" (gray cloud)

### For GoDaddy:
1. Login to GoDaddy account
2. Go to My Products > DNS
3. Find and **delete** CNAME record: www → yellowboxdxb.com
4. **Add** new CNAME record: www → yellowbox-8e0e6.web.app

### For Namecheap:
1. Login to Namecheap account
2. Go to Domain List > Manage
3. Advanced DNS tab
4. **Delete** existing CNAME record for www
5. **Add** new CNAME record: www → yellowbox-8e0e6.web.app

### For Other Providers:
1. Access your DNS management panel
2. Look for DNS Records or Zone File
3. Remove the www CNAME pointing to yellowboxdxb.com
4. Add new www CNAME pointing to yellowbox-8e0e6.web.app

## ⏱️ **Propagation Time**
- DNS changes can take 5 minutes to 48 hours to propagate
- Most changes are visible within 15-30 minutes
- Use online DNS checkers to verify propagation

## 🔍 **Verification Steps**

### 1. Check DNS Propagation
```bash
# Check CNAME record
nslookup www.yellowboxdxb.com

# Should return:
# www.yellowboxdxb.com canonical name = yellowbox-8e0e6.web.app
```

### 2. Online DNS Checkers
- https://dnschecker.org/
- https://www.whatsmydns.net/
- Search for: www.yellowboxdxb.com (CNAME)

### 3. Test Domain Access
After propagation, test:
- http://www.yellowboxdxb.com
- https://www.yellowboxdxb.com

## 🚨 **Common Issues**

### Issue 1: "ACME Challenge Failed"
**Cause**: Old DNS records still present
**Solution**: Ensure old CNAME is completely removed

### Issue 2: "SSL Certificate Pending"
**Cause**: DNS not fully propagated
**Solution**: Wait 24-48 hours for full propagation

### Issue 3: "Domain Not Verified"
**Cause**: CNAME pointing to wrong target
**Solution**: Verify CNAME points to yellowbox-8e0e6.web.app

## 📞 **Support Checklist**

Before contacting DNS provider support:
- [ ] Confirmed current DNS records
- [ ] Attempted to delete old CNAME
- [ ] Added new CNAME with correct target
- [ ] Waited at least 30 minutes for propagation
- [ ] Tested with DNS checker tools

## 🎉 **Success Indicators**

You'll know it's working when:
1. ✅ DNS checker shows: www.yellowboxdxb.com → yellowbox-8e0e6.web.app
2. ✅ Firebase Console shows "Connected" status
3. ✅ SSL certificate is issued automatically
4. ✅ www.yellowboxdxb.com loads your Yellow Box app
5. ✅ Automatic redirect from HTTP to HTTPS

## 🔄 **Next Steps After Success**

1. **Update all references** to use www.yellowboxdxb.com
2. **Test all functionality** on the new domain
3. **Update any API endpoints** if needed
4. **Inform users** of the new domain
5. **Set up monitoring** for the custom domain

## 📱 **Mobile & PWA Considerations**

After domain setup:
- Update PWA manifest if needed
- Test mobile app functionality
- Verify push notifications still work
- Update any hardcoded URLs in the app

---

**Need Help?** 
- Check your DNS provider's documentation
- Use online DNS tools to verify changes
- Wait for full propagation before troubleshooting