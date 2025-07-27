# Yellow Box - Credential Setup Guide

## Overview
This guide will walk you through setting up all the necessary credentials and configurations to activate your n8n automation workflows.

## Prerequisites Checklist
- [ ] n8n instance running (local or cloud)
- [ ] Google account with access to Google Cloud Console
- [ ] Firebase project access (yellowbox-8e0e6)
- [ ] Admin access to your Yellow Box application

## Step 1: Google OAuth Setup (✅ Already Configured!)

### 1.1 Your Existing Google OAuth Credentials
I can see you already have Google OAuth credentials configured for your Yellow Box project:

- **Project ID**: `yellowbox-8e0e6`
- **Client ID**: `47222199157-t3nec9ls81gfuu8oav3d2gpdd9vam35f.apps.googleusercontent.com`
- **Client Secret**: `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`
- **Redirect URI**: `http://localhost:5678/rest/oauth2-credential/callback` ✅

The redirect URI is already correctly configured for n8n!

### 1.2 Enable Required APIs (if not already enabled)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: `yellowbox-8e0e6`
3. Go to "APIs & Services" → "Library"
4. Enable these APIs if not already enabled:
   - **Google Sheets API**
   - **Google Drive API** (for file access)
   - **Cloud Firestore API** (for database access)

### 1.3 OAuth Consent Screen (if needed)
If you haven't set up the OAuth consent screen:
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in required fields:
   - **App name**: `Yellow Box Automation`
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/spreadsheets`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/datastore`
5. Save and continue

## Step 2: Google Sheets Setup

### 2.1 Create the Main Spreadsheet
1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Name it: `Yellow Box Automation Data`
4. **Copy the Sheet ID** from the URL (the long string between `/d/` and `/edit`)

### 2.2 Create Required Tabs
Create these tabs in your spreadsheet:

1. **Riders** - Real-time rider data
2. **Expenses** - Real-time expense data  
3. **Documents** - Real-time document data
4. **Sync_Log** - Real-time sync activity log
5. **Riders_Backup** - Scheduled rider backups
6. **Expenses_Backup** - Scheduled expense backups
7. **Documents_Backup** - Scheduled document backups
8. **Backup_Log** - Scheduled backup activity log
9. **Health_Log** - Application health monitoring
10. **Data_Integrity_Log** - Daily integrity check results

### 2.3 Add Headers to Each Tab

**Riders & Riders_Backup tabs:**
```
ID | Name | Email | Phone | Status | Visa Number | License Number | Created At | Updated At
```

**Expenses & Expenses_Backup tabs:**
```
ID | Rider ID | Amount | Category | Description | Receipt URL | Status | Created At | Approved At
```

**Documents & Documents_Backup tabs:**
```
ID | Rider ID | Type | Status | File URL | Expiry Date | Verified By | Created At | Updated At
```

**Sync_Log tab:**
```
Type | Record ID | Action | Status | Timestamp
```

**Backup_Log tab:**
```
Type | Records Count | Status | Timestamp
```

**Health_Log tab:**
```
URL | Status Code | Response Time | Status | Timestamp
```

**Data_Integrity_Log tab:**
```
Total Collections | Rider Records | Expense Records | Document Records | Status | Notes | Timestamp
```

### 2.4 Share Sheet with Service Account
1. Click the "Share" button in your Google Sheet
2. Add the service account email (found in your downloaded JSON file)
3. Give "Editor" permissions
4. Click "Send"

## Step 3: Firebase Setup

### 3.1 Get Firebase Admin SDK Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `yellowbox-8e0e6`
3. Click the gear icon → "Project settings"
4. Go to "Service accounts" tab
5. Click "Generate new private key"
6. Click "Generate key" and download the JSON file
7. **Save this file securely**

### 3.2 Note Your Firebase Configuration
From your Firebase project settings, note down:
- **Project ID**: `yellowbox-8e0e6`
- **Web API Key**: (found in General tab)
- **Database URL**: (if using Realtime Database)

## Step 4: n8n Credential Configuration

### 4.1 Access n8n Interface
1. Open your browser
2. Go to your n8n instance: `http://localhost:5678`
3. Log in to n8n

### 4.2 Add Google Sheets API Credential (OAuth2)
1. Click on "Credentials" in the left sidebar
2. Click "Add Credential"
3. Search for "Google Sheets API"
4. Select **OAuth2** authentication method
5. Fill in your OAuth credentials:
   - **Client ID**: `47222199157-t3nec9ls81gfuu8oav3d2gpdd9vam35f.apps.googleusercontent.com`
   - **Client Secret**: `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`
   - **Name**: `YellowBox Google Sheets`
6. Click "Connect my account"
7. Authorize with your Google account
8. Click "Save"

### 4.3 Add Google API Credential (for Firestore)
1. Click "Add Credential" again
2. Search for "Google API"
3. Select **OAuth2** authentication method
4. Fill in your OAuth credentials:
   - **Client ID**: `47222199157-t3nec9ls81gfuu8oav3d2gpdd9vam35f.apps.googleusercontent.com`
   - **Client Secret**: `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`
   - **Name**: `YellowBox Google API`
   - **Scopes**: Add these scopes:
     - `https://www.googleapis.com/auth/datastore`
     - `https://www.googleapis.com/auth/firebase`
     - `https://www.googleapis.com/auth/cloud-platform`
5. Click "Connect my account"
6. Authorize with your Google account
7. Click "Save"

### 4.4 Add EmailJS Credential (for Alerts)
1. First, set up EmailJS account at https://www.emailjs.com/
2. Create email templates for health and integrity alerts
3. In n8n, click "Add Credential"
4. Search for "HTTP Request Auth"
5. Select "None" (EmailJS uses API keys in request body)
6. Name: `EmailJS API`
7. Click "Save"

**Note your EmailJS details for configuration:**
- Service ID: `service_xxxxxxx`
- Template IDs: `template_xxxxxxx`
- User ID: `user_xxxxxxx`

## Step 5: Configure Workflow Parameters

### 5.1 Update Workflow Variables
For each of the 4 workflows, you need to update these values:

**Replace these placeholders:**
- `YOUR_GOOGLE_SHEET_ID` → Your actual Google Sheet ID (from Step 2.1)
- `YOUR_FIREBASE_PROJECT_ID` → `yellowbox-8e0e6`
- `YOUR_APP_URL` → Your Yellow Box app URL (e.g., `https://yellowbox-8e0e6.web.app`)

### 5.2 Workflow-Specific Configuration

#### Real-time Data Sync Workflow (ID: e91V8Vqp3fxl80PS)
- Set Google Sheets credential to: `YellowBox Google Sheets`
- Update Sheet ID in all Google Sheets nodes
- Configure webhook URL (will be provided by n8n)

#### Scheduled Data Backup (ID: mpchfdzgAVmAVlVU)
- Set Google Sheets credential to: `YellowBox Google Sheets`
- Update Sheet ID in all Google Sheets nodes
- Configure Firebase credentials
- Set schedule to run every 6 hours

#### Health Monitoring (ID: yz8EHQamhw1mb8Sx)
- Update app URL to check
- Set Google Sheets credential
- Configure to run every 15 minutes

#### Data Integrity Check (ID: LGoTcdR0z8xMHYSW)
- Configure Firebase credentials
- Set Google Sheets credential
- Schedule for daily execution at midnight

## Step 6: Test and Activate Workflows

### 6.1 Test Each Workflow
1. Open each workflow in n8n
2. Click "Execute Workflow" button
3. Check for any errors
4. Verify data appears in Google Sheets
5. Fix any configuration issues

### 6.2 Activate Workflows
Once testing is successful:
1. Toggle the "Active" switch for each workflow
2. Monitor the execution log for any issues
3. Check Google Sheets for incoming data

## Step 7: Integrate with Your App

### 7.1 Add Webhook Integration
Update your Firebase Functions or React app to send webhooks to n8n when data changes.

**Webhook URL format:**
```
https://your-n8n-instance.com/webhook/yellowbox-sync
```

### 7.2 Test Real-time Sync
1. Make a change in your Yellow Box app (create/update a rider, expense, or document)
2. Check if the webhook triggers the n8n workflow
3. Verify the data appears in Google Sheets
4. Check the Sync_Log tab for activity

## Troubleshooting

### Common Issues:

**Authentication Errors:**
- Verify service account has correct permissions
- Check if JSON files are valid
- Ensure sheets are shared with service account

**Webhook Not Triggering:**
- Check webhook URL is accessible
- Verify payload format matches expected structure
- Check n8n execution logs

**Data Not Syncing:**
- Verify sheet tab names match exactly
- Check column headers are correct
- Review error logs in n8n

**Rate Limiting:**
- Google Sheets API has limits (100 requests per 100 seconds per user)
- Implement delays if hitting limits
- Consider batching operations

## Security Best Practices

1. **Keep credentials secure** - never commit JSON files to version control
2. **Use least privilege** - only grant necessary permissions
3. **Regular rotation** - rotate service account keys periodically
4. **Monitor access** - review who has access to sheets and credentials
5. **Secure n8n** - use authentication and HTTPS for n8n instance

## Support

If you encounter issues:
1. Check n8n execution logs for detailed error messages
2. Verify all credentials are correctly configured
3. Test individual nodes in workflows
4. Check Google Sheets API quotas and limits
5. Review Firebase security rules if data access fails

## Next Steps

Once everything is configured and working:
1. Set up monitoring alerts for workflow failures
2. Create backup procedures for your n8n workflows
3. Document any customizations you make
4. Train your team on using the automated reports
5. Consider scaling your n8n instance for production use

Your Yellow Box automation system will now provide:
- ✅ Real-time data synchronization
- ✅ Automated daily backups
- ✅ Continuous health monitoring
- ✅ Daily data integrity checks
- ✅ Comprehensive logging and reporting