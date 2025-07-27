# Yellow Box - n8n Automation Setup Guide

## Overview
This guide provides comprehensive automation workflows for the Yellow Box fleet management system using n8n. These workflows ensure data synchronization, backup, health monitoring, and integrity checks.

## Created Workflows

### 1. Real-time Data Sync (ID: e91V8Vqp3fxl80PS)
**Purpose**: Instantly sync data changes from Firebase to Google Sheets
**Trigger**: Webhook (POST to `/yellowbox-sync`)
**Frequency**: Real-time (triggered by app events)

**Features**:
- Routes data based on type (riders, expenses, documents)
- Syncs to separate Google Sheets tabs
- Logs all sync activities
- Handles upsert operations (append or update)

### 2. Scheduled Data Backup (ID: mpchfdzgAVmAVlVU)
**Purpose**: Regular backup of all Firebase data to Google Sheets
**Trigger**: Schedule (every 6 hours)
**Frequency**: 4 times daily

**Features**:
- Fetches all riders, expenses, and documents from Firebase
- Creates backup copies in Google Sheets
- Sequential processing to avoid rate limits
- Comprehensive logging with record counts

### 3. Health Monitoring (ID: yz8EHQamhw1mb8Sx)
**Purpose**: Monitor application health and availability
**Trigger**: Schedule (every 15 minutes)
**Frequency**: 96 times daily

**Features**:
- Checks app availability and response time
- Logs health status to Google Sheets
- Tracks response codes and performance metrics
- Retry mechanism for failed requests

### 4. Data Integrity Check (ID: LGoTcdR0z8xMHYSW)
**Purpose**: Daily validation of data consistency and integrity
**Trigger**: Schedule (daily at midnight)
**Frequency**: Once daily

**Features**:
- Validates Firebase collections
- Counts records by type
- Identifies data inconsistencies
- Comprehensive integrity reporting

## Setup Instructions

### Prerequisites
1. **n8n Instance**: Running n8n server (cloud or self-hosted)
2. **Google Sheets**: Prepared spreadsheet with required tabs
3. **Firebase Access**: Service account or OAuth credentials
4. **Email Service**: For alerts (optional)

### Step 1: Google Sheets Setup

Create a Google Spreadsheet with the following tabs:

#### Required Sheets:
1. **Riders** - Real-time rider data sync
2. **Expenses** - Real-time expense data sync  
3. **Documents** - Real-time document data sync
4. **Sync_Log** - Real-time sync activity log
5. **Riders_Backup** - Scheduled rider backups
6. **Expenses_Backup** - Scheduled expense backups
7. **Documents_Backup** - Scheduled document backups
8. **Backup_Log** - Scheduled backup activity log
9. **Health_Log** - Application health monitoring
10. **Data_Integrity_Log** - Daily integrity check results

#### Headers for each sheet:

**Riders/Riders_Backup**:
```
ID | Name | Email | Phone | Status | Visa Number | License Number | Created At | Updated At
```

**Expenses/Expenses_Backup**:
```
ID | Rider ID | Amount | Category | Description | Receipt URL | Status | Created At | Approved At
```

**Documents/Documents_Backup**:
```
ID | Rider ID | Type | Status | File URL | Expiry Date | Verified By | Created At | Updated At
```

**Sync_Log**:
```
Type | Record ID | Action | Status | Timestamp
```

**Backup_Log**:
```
Type | Records Count | Status | Timestamp
```

**Health_Log**:
```
URL | Status Code | Response Time | Status | Timestamp
```

**Data_Integrity_Log**:
```
Total Collections | Rider Records | Expense Records | Document Records | Status | Notes | Timestamp
```

### Step 2: Configure Workflows

For each workflow, update the following parameters:

#### Replace Placeholders:
- `YOUR_GOOGLE_SHEET_ID` → Your Google Sheets document ID
- `YOUR_FIREBASE_PROJECT_ID` → yellowbox-8e0e6 (already set)
- `YOUR_EMAILJS_SERVICE_ID` → Your EmailJS service ID (for alerts)
- `YOUR_EMAILJS_TEMPLATE_ID` → Your EmailJS template ID
- `YOUR_EMAILJS_USER_ID` → Your EmailJS user ID

#### Google Sheets Authentication:
1. Create Google OAuth2 credentials or Service Account
2. Configure credentials in n8n
3. Grant access to your Google Sheets document

#### Firebase Authentication:
1. Create Firebase Service Account
2. Download service account JSON
3. Configure Firebase credentials in n8n

### Step 3: Webhook Integration

For real-time sync, integrate webhooks in your Yellow Box application:

#### Firebase Functions Integration:
```javascript
// functions/src/webhooks.js
const functions = require('firebase-functions');
const axios = require('axios');

const N8N_WEBHOOK_URL = 'https://your-n8n-instance.com/webhook/yellowbox-sync';

exports.syncToSheets = functions.firestore
  .document('{collection}/{docId}')
  .onWrite(async (change, context) => {
    const { collection, docId } = context.params;
    
    // Determine action type
    let action = 'updated';
    if (!change.before.exists) action = 'created';
    if (!change.after.exists) action = 'deleted';
    
    // Prepare webhook payload
    const payload = {
      type: collection.slice(0, -1), // Remove 's' from collection name
      id: docId,
      action: action,
      data: change.after.exists ? change.after.data() : null,
      timestamp: new Date().toISOString()
    };
    
    try {
      await axios.post(N8N_WEBHOOK_URL, payload);
      console.log(`Webhook sent for ${collection}/${docId}`);
    } catch (error) {
      console.error('Webhook failed:', error);
    }
  });
```

#### React App Integration:
```typescript
// src/services/webhookService.ts
const WEBHOOK_URL = 'https://your-n8n-instance.com/webhook/yellowbox-sync';

export const triggerSync = async (type: string, id: string, action: string, data: any) => {
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        id,
        action,
        data,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Sync webhook failed:', error);
  }
};

// Usage in your services
export const createRider = async (riderData: Rider) => {
  const docRef = await addDoc(collection(db, 'riders'), riderData);
  await triggerSync('rider', docRef.id, 'created', riderData);
  return docRef;
};
```

### Step 4: Activate Workflows

1. **Import Workflows**: Import the created workflows into your n8n instance
2. **Configure Credentials**: Set up Google Sheets and Firebase credentials
3. **Test Workflows**: Run each workflow manually to verify configuration
4. **Activate Workflows**: Enable all workflows for automatic execution

### Step 5: Monitoring and Maintenance

#### Monitoring Checklist:
- [ ] Check sync logs daily for errors
- [ ] Monitor backup completion
- [ ] Review health check results
- [ ] Validate data integrity reports
- [ ] Monitor n8n execution history

#### Maintenance Tasks:
- **Weekly**: Review error logs and fix issues
- **Monthly**: Optimize workflow performance
- **Quarterly**: Update credentials and review security

## Workflow Details

### Real-time Data Sync Workflow
```
Webhook Trigger → Data Router → [Sync to Sheets] → Log Activity
                     ↓
              [Riders/Expenses/Documents]
```

### Scheduled Backup Workflow
```
Schedule → Fetch Riders → Backup → Fetch Expenses → Backup → Fetch Documents → Backup → Log
```

### Health Monitoring Workflow
```
Schedule → Check Health → Log Status
```

### Data Integrity Workflow
```
Schedule → Fetch Collections → Validate → Log Results
```

## Troubleshooting

### Common Issues:

1. **Authentication Errors**
   - Verify Google Sheets permissions
   - Check Firebase service account credentials
   - Ensure OAuth tokens are valid

2. **Webhook Failures**
   - Check n8n webhook URL accessibility
   - Verify payload format
   - Review network connectivity

3. **Rate Limiting**
   - Implement delays between requests
   - Use batch operations where possible
   - Monitor API quotas

4. **Data Sync Issues**
   - Verify sheet column mappings
   - Check data type compatibility
   - Review error logs for specific failures

### Error Handling:

Each workflow includes:
- Retry mechanisms for failed requests
- Error logging to Google Sheets
- Fallback operations for critical failures
- Timeout handling for long-running operations

## Security Considerations

1. **Credentials Management**
   - Store all credentials securely in n8n
   - Use environment variables for sensitive data
   - Regularly rotate API keys and tokens

2. **Access Control**
   - Limit Google Sheets access to necessary users
   - Use least-privilege principle for Firebase access
   - Secure n8n instance with authentication

3. **Data Privacy**
   - Ensure GDPR compliance for personal data
   - Implement data retention policies
   - Secure webhook endpoints

## Performance Optimization

1. **Batch Operations**
   - Group multiple records in single requests
   - Use bulk operations where available
   - Implement intelligent batching logic

2. **Caching**
   - Cache frequently accessed data
   - Implement smart refresh strategies
   - Use conditional requests where possible

3. **Resource Management**
   - Monitor n8n resource usage
   - Optimize workflow execution times
   - Scale infrastructure as needed

## Support and Maintenance

For ongoing support:
1. Monitor n8n execution logs
2. Set up alerts for workflow failures
3. Regular backup of n8n workflows
4. Document any customizations or changes

This automation system ensures your Yellow Box application data is always synchronized, backed up, and monitored for optimal performance and reliability.