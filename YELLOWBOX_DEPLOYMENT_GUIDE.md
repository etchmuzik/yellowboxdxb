# Yellow Box Complete Deployment Guide

## Overview

This guide provides step-by-step instructions to deploy and test the complete Yellow Box fleet management system, including the web application, MCP server, and N8N integrations.

## Prerequisites

- Node.js 18+ and npm
- Firebase CLI installed (`npm install -g firebase-tools`)
- Docker and Docker Compose (for MCP server)
- Google Cloud account with billing enabled
- N8N instance (local or cloud)

## Phase 1: Initial Setup

### 1.1 Clone and Setup Project

```bash
# Navigate to project directory
cd yellowbox/yellowboxdxb-main

# Install dependencies
npm install --legacy-peer-deps

# Check environment file
cat .env
```

### 1.2 Firebase Project Setup

1. **Login to Firebase**:
   ```bash
   firebase login
   ```

2. **Select Project**:
   ```bash
   firebase use yellowbox-8e0e6
   ```

3. **Enable Bootstrap Mode** (for first admin):
   ```bash
   node scripts/toggle-bootstrap-mode.js enable
   ```

4. **Deploy Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Phase 2: Create Initial Admin

### 2.1 Start Development Server

```bash
npm run dev
```

### 2.2 Create Admin Account

1. Open browser to `http://localhost:8080`
2. Click "Sign Up" 
3. Create admin account:
   - Email: admin@yellowbox.ae
   - Password: YellowBox2025!
   - Name: Admin User
   - Role: Admin

### 2.3 Disable Bootstrap Mode

```bash
node scripts/toggle-bootstrap-mode.js disable
firebase deploy --only firestore:rules
```

## Phase 3: Seed Test Data

### 3.1 Configure Firebase Admin SDK

Create a service account:
1. Go to Firebase Console > Project Settings > Service Accounts
2. Generate new private key
3. Save as `serviceAccount.json` in project root

### 3.2 Run Comprehensive Seed Script

```bash
export GOOGLE_APPLICATION_CREDENTIALS="./serviceAccount.json"
node scripts/seed-comprehensive-data.js
```

This creates:
- 3 test users (Admin, Operations, Finance)
- 50 test riders in various stages
- Expenses, documents, bikes, budgets
- Sample notifications

## Phase 4: Deploy MCP Server

### 4.1 Setup MCP Server

```bash
cd ../mcp-server

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with Firebase credentials
```

### 4.2 Start MCP Server

**Option 1: Local Development**
```bash
npm run dev
```

**Option 2: Docker Compose**
```bash
docker-compose up -d
```

### 4.3 Test MCP Server

```bash
# Health check
curl http://localhost:3001/api/health

# Detailed health check
curl http://localhost:3001/api/health/detailed
```

## Phase 5: Configure N8N Workflows

### 5.1 Access N8N

- Local: `http://localhost:5678`
- Cloud: Your N8N instance URL
- Credentials: admin / yellowbox (if using Docker Compose)

### 5.2 Import Workflows

1. In N8N, go to Workflows > Import
2. Import `COMPLETE_N8N_WORKFLOW.json`
3. Configure credentials:
   - Google Sheets OAuth2
   - Google API (for Firestore)
   - EmailJS (optional)

### 5.3 Configure Google Sheets

1. Create a new Google Sheet
2. Share with service account email
3. Note the Sheet ID from URL

### 5.4 Update Workflow Settings

Run configuration script:
```bash
cd ../yellowboxdxb-main
node scripts/configure-n8n-workflows.js
```

### 5.5 Activate Workflows

In N8N:
1. Open each workflow
2. Toggle "Active" switch
3. Test webhook endpoint

## Phase 6: Test Complete System

### 6.1 Test Authentication

```bash
# Test all user roles
# Admin: admin@yellowbox.ae / YellowBox2025!
# Operations: operations@yellowbox.ae / YellowBox2025!
# Finance: finance@yellowbox.ae / YellowBox2025!
```

### 6.2 Test Real-time Features

1. **WebSocket Connection**:
   - Open browser console
   - Check for "Connected to MCP WebSocket server" message

2. **Live Updates**:
   - Open two browser windows with different roles
   - Create expense in one window
   - See real-time update in another

### 6.3 Test N8N Integration

```bash
# Test webhook
curl -X POST http://localhost:5678/webhook/yellowbox-sync \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "test",
    "data": {
      "message": "Test integration",
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }
  }'
```

Check Google Sheets for data sync.

### 6.4 Test Key Features

1. **Rider Management**:
   - View rider list
   - Change rider stages
   - Upload documents

2. **Expense Workflow**:
   - Submit expense as rider
   - Approve/reject as finance

3. **Bike Tracking**:
   - View live map
   - Check bike assignments

4. **Document Verification**:
   - Upload documents
   - Verify as operations

## Phase 7: Production Deployment

### 7.1 Build for Production

```bash
cd yellowboxdxb-main
npm run build:production
```

### 7.2 Deploy to Firebase Hosting

```bash
# Deploy everything
firebase deploy

# Or deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore
```

### 7.3 Configure Production Environment

1. **Update CORS** in MCP server for production domain
2. **Set API key restrictions** in Google Cloud Console
3. **Enable Firebase App Check**
4. **Configure custom domain** (optional)

### 7.4 Deploy MCP Server to Production

**Option 1: Google Cloud Run**
```bash
cd mcp-server
gcloud run deploy yellowbox-mcp-server \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

**Option 2: Traditional VPS**
```bash
# On server
docker-compose -f docker-compose.prod.yml up -d
```

## Verification Checklist

- [ ] Firebase Authentication working
- [ ] All user roles can login
- [ ] Firestore security rules enforced
- [ ] Bootstrap mode disabled
- [ ] Test data seeded successfully
- [ ] MCP server health check passing
- [ ] WebSocket connections established
- [ ] N8N workflows active
- [ ] Google Sheets data syncing
- [ ] Real-time updates working
- [ ] Document uploads functioning
- [ ] Expense workflow operational
- [ ] Bike tracking displaying
- [ ] Notifications delivered
- [ ] No console errors in production

## Common Issues & Solutions

### Issue: npm install fails
**Solution**: Always use `npm install --legacy-peer-deps`

### Issue: Bootstrap mode not working
**Solution**: 
1. Ensure rules are deployed after enabling
2. Check Firebase Console for rule errors

### Issue: MCP server connection failed
**Solution**:
1. Check CORS configuration
2. Verify Firebase credentials
3. Check firewall/port settings

### Issue: N8N webhook not receiving data
**Solution**:
1. Verify webhook URL in webhookService.ts
2. Check N8N workflow is active
3. Test with curl command

### Issue: Google Sheets not updating
**Solution**:
1. Verify service account has access
2. Check Sheet ID is correct
3. Review N8N execution logs

## Monitoring & Maintenance

### Daily Checks
- Monitor Firebase usage/costs
- Check N8N execution history
- Review MCP server logs
- Verify backup completeness

### Weekly Tasks
- Review error logs
- Check security events
- Update dependencies
- Test critical workflows

### Monthly Tasks
- Security audit
- Performance optimization
- Cost analysis
- User feedback review

## Support Resources

- **Firebase Console**: https://console.firebase.google.com
- **Google Cloud Console**: https://console.cloud.google.com
- **N8N Documentation**: https://docs.n8n.io
- **Project Issues**: GitHub repository

## Emergency Procedures

### Rollback Deployment
```bash
firebase hosting:rollback
```

### Disable All Access
```bash
# Set Firestore rules to deny all
firebase deploy --only firestore:rules
```

### Emergency Contacts
- Technical Lead: [Contact Info]
- Firebase Support: [Ticket System]
- Infrastructure: [On-call Number]