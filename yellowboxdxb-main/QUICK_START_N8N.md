# Yellow Box n8n Quick Start Guide

## 🚀 Getting Started with n8n Automation

This guide will help you install n8n and set up the Yellow Box automation workflows in just a few steps.

## Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)
- Your Yellow Box project running

## Step 1: Install n8n

Choose one of these installation methods:

### Option A: Use Our Installer (Recommended)
```bash
cd yellowboxdxb-main
./install-n8n.sh
```

### Option B: Install Manually
```bash
npm install -g n8n
n8n start
```

### Option C: Use Docker
```bash
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

## Step 2: Start n8n

If you used Option A above, n8n will start automatically. Otherwise:

### Start in Background
```bash
./start-n8n-background.sh
```

### Start in Foreground
```bash
n8n start
```

## Step 3: Access n8n Interface

Open your browser and go to: **http://localhost:5678**

You'll see the n8n welcome screen. Create an account or skip if prompted.

## Step 4: Import Yellow Box Workflows

The workflows are already created and ready to import:

1. In n8n, click **"Import from File"** or go to **Workflows > Import**
2. Import these files one by one:
   - `n8n-workflows/real-time-data-sync.json`
   - `n8n-workflows/scheduled-data-backup.json`
   - `n8n-workflows/health-monitoring.json`
   - `n8n-workflows/data-integrity-check.json`

## Step 5: Set Up Credentials

Run the credential setup helper:
```bash
./simple-setup.sh
```

This will guide you through setting up:
- Google Sheets API credentials
- Google Firebase credentials
- EmailJS credentials (optional)

## Step 6: Configure Google OAuth

You already have Google OAuth credentials set up:
- **Project ID**: yellowbox-8e0e6
- **Client ID**: 1051749938157-4aqhqhqhqhqhqhqhqhqhqhqhqhqhqh.apps.googleusercontent.com
- **Redirect URI**: http://localhost:5678/rest/oauth2-credential/callback

### In n8n Credentials:

1. Go to **Settings > Credentials**
2. Click **"Add Credential"**
3. Search for **"Google Sheets API"**
4. Choose **OAuth2** authentication
5. Enter your credentials:
   - **Client ID**: Your existing client ID
   - **Client Secret**: Your existing client secret
   - **Scope**: `https://www.googleapis.com/auth/spreadsheets`
6. Click **"Connect my account"** and authorize
7. Save as **"Yellow Box Google Sheets"**

Repeat for **Google Firebase** with scope: `https://www.googleapis.com/auth/firebase`

## Step 7: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new sheet named **"Yellow Box Data"**
3. Copy the Sheet ID from the URL (the long string between `/d/` and `/edit`)
4. Update the workflows with your Sheet ID

## Step 8: Activate Workflows

In n8n, activate these workflows:
- ✅ Yellow Box - Real-time Data Sync
- ✅ Yellow Box - Scheduled Data Backup  
- ✅ Yellow Box - Health Monitoring
- ✅ Yellow Box - Data Integrity Check

## Step 9: Test Your Setup

Test the webhook endpoint:
```bash
./test-webhook.sh
```

## 🎯 What Each Workflow Does

### Real-time Data Sync
- **Trigger**: Webhook from your Yellow Box app
- **Action**: Syncs data to Google Sheets in real-time
- **Webhook URL**: `http://localhost:5678/webhook/yellowbox-sync`

### Scheduled Data Backup
- **Trigger**: Every 6 hours
- **Action**: Backs up all data from Firebase to Google Sheets
- **Schedule**: 00:00, 06:00, 12:00, 18:00 daily

### Health Monitoring
- **Trigger**: Every 15 minutes
- **Action**: Checks system health and sends alerts if issues found
- **Monitors**: API endpoints, database connectivity, error rates

### Data Integrity Check
- **Trigger**: Daily at 2:00 AM
- **Action**: Validates data consistency between Firebase and sheets
- **Reports**: Missing records, data mismatches, sync issues

## 🔧 Troubleshooting

### n8n Won't Start
```bash
# Check if port 5678 is in use
lsof -i :5678

# Kill any process using the port
kill -9 <PID>

# Try starting again
./start-n8n-background.sh
```

### Workflows Not Working
1. Check credentials are properly set up
2. Verify Google Sheet permissions
3. Check webhook URLs in your Yellow Box app
4. Review workflow execution logs in n8n

### Authentication Issues
1. Verify OAuth redirect URI: `http://localhost:5678/rest/oauth2-credential/callback`
2. Check Google Cloud Console API permissions
3. Ensure credentials are saved with correct names

## 📚 Additional Resources

- **Full Setup Guide**: `CREDENTIAL_SETUP_GUIDE.md`
- **Deployment Status**: `DEPLOYMENT_STATUS.md`
- **Automation Summary**: `AUTOMATION_SUMMARY.md`
- **n8n Documentation**: https://docs.n8n.io/

## 🆘 Need Help?

If you encounter issues:
1. Check the logs: `tail -f logs/n8n.log`
2. Review workflow execution history in n8n
3. Run the validation script: `./validate-workflows.sh`
4. Check the troubleshooting section in `CREDENTIAL_SETUP_GUIDE.md`

---

**🎉 Congratulations!** Your Yellow Box automation is now set up and ready to streamline your fleet management operations!