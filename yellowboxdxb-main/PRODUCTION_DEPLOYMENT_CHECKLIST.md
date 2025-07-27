# Yellow Box Production Deployment Checklist

## Pre-Deployment Checklist

### 🔐 Security & Access
- [ ] Firebase project created for production
- [ ] Production environment variables configured in `.env.production`
- [ ] Firebase service account created for CI/CD
- [ ] Google Maps API key configured with domain restrictions
- [ ] Firebase App Check enabled (if using)
- [ ] Sentry DSN configured (if using)

### 📋 Environment Variables
Ensure all required variables are set in `.env.production`:
- [ ] `VITE_FIREBASE_API_KEY`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN`
- [ ] `VITE_FIREBASE_PROJECT_ID`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `VITE_FIREBASE_APP_ID`
- [ ] `VITE_FIREBASE_MEASUREMENT_ID`
- [ ] `VITE_GOOGLE_MAPS_API_KEY`

### 🔧 Configuration
- [ ] Production Firestore security rules reviewed and tested
- [ ] Firestore indexes created and deployed
- [ ] Storage security rules configured
- [ ] Firebase hosting configuration updated
- [ ] CSP headers configured properly
- [ ] Rate limiting configured

### 👥 Team Setup
- [ ] Admin user account created
- [ ] Team members added with appropriate roles
- [ ] Emergency contact list prepared
- [ ] Rollback procedure documented

## Deployment Steps

### 1. Pre-Deployment Testing
```bash
# Run all tests
npm test

# Check for security vulnerabilities
npm audit

# Lint code
npm run lint

# Type check
npm run type-check
```

### 2. Build Verification
```bash
# Create production build
npm run build

# Test production build locally
npm run preview
```

### 3. Database Preparation
- [ ] Backup existing data (if migrating)
- [ ] Deploy Firestore security rules
- [ ] Deploy Firestore indexes
- [ ] Run any data migrations

### 4. Deploy Application
```bash
# Option 1: Manual deployment
./scripts/deploy-production.sh

# Option 2: GitHub Actions (push to main branch)
git push origin main
```

### 5. DNS Configuration (if custom domain)
- [ ] Add A records pointing to Firebase Hosting IPs
- [ ] Configure SSL certificate
- [ ] Update firebase.json with custom domain
- [ ] Verify domain ownership in Firebase Console

## Post-Deployment Verification

### 🧪 Functional Testing
- [ ] Login with each user role (Admin, Operations, Finance, Rider-Applicant)
- [ ] Create a test rider
- [ ] Upload a document
- [ ] Submit an expense
- [ ] View bike tracking (if available)
- [ ] Generate a report
- [ ] Test notifications

### 🔍 Technical Verification
- [ ] Check browser console for errors
- [ ] Verify all API endpoints are working
- [ ] Check network tab for failed requests
- [ ] Verify images and assets are loading
- [ ] Test on mobile devices
- [ ] Check PWA installation

### 📊 Monitoring Setup
- [ ] Firebase Analytics receiving events
- [ ] Performance monitoring active
- [ ] Error tracking working (Sentry)
- [ ] Set up alerts for:
  - [ ] High error rates
  - [ ] Performance degradation
  - [ ] Security rule violations
  - [ ] Budget overruns

### 🔐 Security Verification
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] CSP policy active
- [ ] No exposed API keys in source
- [ ] Authentication working properly
- [ ] Authorization rules enforced

## Rollback Procedure

If issues are discovered:

1. **Immediate Rollback**
   ```bash
   ./scripts/rollback-deployment.sh
   ```

2. **Manual Rollback Steps**
   - Go to Firebase Console > Hosting
   - Select previous release
   - Click "Rollback to this release"

3. **Post-Rollback**
   - [ ] Notify team of rollback
   - [ ] Document issue that caused rollback
   - [ ] Create hotfix plan
   - [ ] Test fixes in staging

## Monitoring & Maintenance

### Daily Checks
- [ ] Error rate within acceptable limits
- [ ] Performance metrics normal
- [ ] No security alerts
- [ ] User complaints addressed

### Weekly Tasks
- [ ] Review analytics data
- [ ] Check for unused resources
- [ ] Review error logs
- [ ] Update dependencies (in staging first)

### Monthly Tasks
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Cost analysis
- [ ] Backup verification

## Emergency Contacts

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| Tech Lead | [Name] | [Email/Phone] | 24/7 |
| DevOps | [Name] | [Email/Phone] | Business hours |
| Product Owner | [Name] | [Email/Phone] | Business hours |
| Firebase Support | - | Firebase Console | 24/7 |

## Important URLs

- **Production App**: https://[your-project].web.app
- **Firebase Console**: https://console.firebase.google.com/project/[your-project]
- **Google Cloud Console**: https://console.cloud.google.com/project/[your-project]
- **Monitoring Dashboard**: [Your monitoring URL]
- **Documentation**: [Your docs URL]

## Notes

- Always deploy to staging first
- Never deploy on Fridays unless critical
- Keep deployment logs for audit trail
- Update this checklist based on lessons learned

---

Last Updated: [Date]
Version: 1.0