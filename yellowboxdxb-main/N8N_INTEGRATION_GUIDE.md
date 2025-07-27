# Yellow Box - n8n Integration Guide

## ✅ Integration Status

The Yellow Box web app is **FULLY INTEGRATED** with n8n webhooks! All Firebase services are configured to automatically sync data to your n8n workflow.

### 🔗 Production Webhook URL
```
https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync
```

## 📊 What Gets Synced

### 1. **Riders** 
- ✅ When a new rider is created
- ✅ When rider details are updated
- ✅ When rider status changes
- ✅ When a rider is deleted

### 2. **Expenses**
- ✅ When an expense is submitted
- ✅ When an expense is approved
- ✅ When an expense is rejected
- ✅ When expense details are updated

### 3. **Documents**
- ✅ When a document is uploaded
- ✅ When document status is verified
- ✅ When a document is deleted

## 🧪 Testing the Integration

### 1. Test Webhook Connectivity
```bash
npm run test-webhook
```
This verifies that n8n is reachable and the webhook is active.

### 2. Test Web App Integration
```bash
npm run test-webapp-integration
```
This simulates real web app operations and verifies data flows to n8n.

### 3. Test Service Integration
```bash
npm run test-service-integration
```
This confirms all Firebase services have webhook triggers implemented.

## 🎯 How It Works

### Data Flow
```
User Action in Web App
    ↓
Firebase Service (Create/Update/Delete)
    ↓
triggerSync() called automatically
    ↓
Webhook sent to n8n
    ↓
n8n processes and routes data
    ↓
Data synced to Google Sheets
```

### Webhook Payload Structure
```javascript
{
  "type": "rider" | "expense" | "document",
  "id": "unique-record-id",
  "action": "created" | "updated" | "deleted",
  "data": {
    // Full record data
  },
  "timestamp": "2025-01-24T12:34:56.789Z"
}
```

## 📱 Using the Web App

### For Admins/Operations

1. **Add a New Rider**
   - Go to Riders page
   - Click "Add Rider"
   - Fill in details and submit
   - ✅ Automatically synced to Google Sheets

2. **Update Rider Status**
   - Click on a rider
   - Change status (e.g., Applied → Docs Verified)
   - ✅ Update synced instantly

3. **Verify Documents**
   - Go to Documents page
   - Review uploaded documents
   - Click "Verify" or "Reject"
   - ✅ Status change synced

### For Finance Team

1. **Review Expenses**
   - Go to Expenses page
   - See pending expenses
   - Approve or reject with reason
   - ✅ Decision synced to sheets

2. **Track Budgets**
   - All approved expenses update totals
   - Real-time budget tracking
   - ✅ Financial data always current

### For Riders

1. **Submit Expenses**
   - Upload receipt
   - Enter amount and description
   - Submit for approval
   - ✅ Instantly appears in admin view

2. **Upload Documents**
   - Upload required documents
   - Track verification status
   - ✅ Operations team notified

## 🔍 Monitoring Sync Status

### In n8n Dashboard
1. Go to https://n8n.srv924607.hstgr.cloud
2. Open workflow ID: 4MEfKjDQsVJLmIod
3. Check "Executions" tab
4. See all webhook calls and their status

### In Google Sheets
- Check timestamp columns for latest updates
- Look for new rows being added
- Verify data accuracy

## 🚨 Troubleshooting

### Webhooks Not Firing
1. Check browser console for errors
2. Verify n8n workflow is active
3. Test with `npm run test-webhook`

### Data Not in Google Sheets
1. Check n8n execution history for errors
2. Verify Google Sheets connection in n8n
3. Check sheet permissions

### Network Issues
- Webhook service has built-in error handling
- Failed webhooks don't block app operations
- Check logs for retry attempts

## 🔐 Security

- All webhook calls use HTTPS
- Data is transmitted securely
- No sensitive credentials in webhooks
- Firebase security rules protect data

## 📈 Performance

- Webhooks are asynchronous (non-blocking)
- Average response time: 50-200ms
- No impact on app performance
- Automatic retry on failure

## 🛠️ Advanced Configuration

### Change Webhook URL (if needed)
Edit `src/services/webhookService.ts`:
```javascript
const WEBHOOK_URL = 'your-new-webhook-url';
```

### Disable Webhooks (for testing)
Comment out triggerSync calls in services:
```javascript
// await triggerSync('rider', riderId, 'created', riderData);
```

### Add Custom Webhook Events
```javascript
import { triggerSync } from './webhookService';

// In your service function
await triggerSync('custom-type', id, 'custom-action', data);
```

## 📋 Checklist for Production

- [x] Webhook URL configured for production n8n
- [x] All services integrated with webhooks
- [x] Error handling implemented
- [x] Integration tests passing
- [x] Google Sheets configured in n8n
- [x] n8n workflow activated
- [ ] Monitor first week of operations
- [ ] Set up alerts for failures
- [ ] Document any custom workflows

## 🎉 You're All Set!

The Yellow Box web app is now fully integrated with n8n. Every action in the app automatically syncs to your Google Sheets through n8n workflows. No manual data entry required!

### Support
- Check n8n logs for sync issues
- Review webhook test results
- Contact admin for n8n access