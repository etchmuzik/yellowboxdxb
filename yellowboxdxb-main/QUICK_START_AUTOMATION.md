# Yellow Box - Automation Quick Start Guide

## 🚀 Get Your Automation Running in 30 Minutes

This guide will get your Yellow Box automation system up and running quickly.

## Prerequisites (5 minutes)

Before starting, make sure you have:
- [ ] Node.js 16+ installed
- [ ] Google account
- [ ] Firebase project access (yellowbox-8e0e6)
- [ ] Terminal/command line access

## Step 1: Deploy n8n (5 minutes)

1. **Run the deployment script:**
   ```bash
   cd yellowboxdxb-main
   chmod +x scripts/deploy-automation.sh
   ./scripts/deploy-automation.sh
   ```

2. **Wait for n8n to start** (it will open at http://localhost:5678)

3. **Set up your n8n account** (first time only)

## Step 2: Set Up Google Cloud (10 minutes)

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**

2. **Create/Select Project:**
   - Create new project: `yellowbox-automation`
   - Or use existing project

3. **Enable APIs:**
   - Go to "APIs & Services" → "Library"
   - Enable "Google Sheets API"
   - Enable "Google Drive API"

4. **Create Service Account:**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "Service Account"
   - Name: `yellowbox-n8n-service`
   - Role: "Editor"
   - Download JSON key file

## Step 3: Set Up Google Sheets (5 minutes)

1. **Create new Google Sheet:**
   - Go to [Google Sheets](https://sheets.google.com/)
   - Create new sheet: "Yellow Box Automation Data"
   - Copy the Sheet ID from URL

2. **Create these tabs:**
   - Riders
   - Expenses
   - Documents
   - Sync_Log
   - Riders_Backup
   - Expenses_Backup
   - Documents_Backup
   - Backup_Log
   - Health_Log
   - Data_Integrity_Log

3. **Share with service account:**
   - Click "Share" button
   - Add service account email (from JSON file)
   - Give "Editor" permissions

## Step 4: Configure Credentials (5 minutes)

1. **Run the credential helper:**
   ```bash
   ./setup-credentials.sh
   ```

2. **Follow the prompts** to enter:
   - Google Sheet ID
   - Service account email
   - Firebase project ID (yellowbox-8e0e6)
   - App URL (https://yellowbox-8e0e6.web.app)

3. **Add credentials in n8n:**
   - Open http://localhost:5678
   - Go to "Credentials"
   - Add "Google Sheets API" credential (upload JSON file)
   - Name it: `YellowBox Google Sheets`

## Step 5: Import and Activate Workflows (5 minutes)

1. **Get workflow IDs:**
   ```bash
   ./import-workflows.sh
   ```

2. **Import in n8n:**
   - Go to "Workflows" tab
   - Click "Add Workflow" → "Import from URL"
   - Use these IDs:
     - Real-time Sync: `e91V8Vqp3fxl80PS`
     - Scheduled Backup: `mpchfdzgAVmAVlVU`
     - Health Monitoring: `yz8EHQamhw1mb8Sx`
     - Data Integrity: `LGoTcdR0z8xMHYSW`

3. **Configure each workflow:**
   - Replace `YOUR_GOOGLE_SHEET_ID` with your actual Sheet ID
   - Set credentials to `YellowBox Google Sheets`
   - Test each workflow
   - Activate workflows

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] n8n is running at http://localhost:5678
- [ ] All 4 workflows imported successfully
- [ ] Google Sheets credentials configured
- [ ] Workflows tested and activated
- [ ] Data appears in Google Sheets when testing

## 🎯 What You Get

Once configured, your system will automatically:

1. **Real-time Sync** - Instantly sync data changes to Google Sheets
2. **Daily Backups** - Backup all data every 6 hours
3. **Health Monitoring** - Check app health every 15 minutes
4. **Data Integrity** - Validate data consistency daily

## 🔧 Monitoring

Monitor your automation:
```bash
./monitor-workflows.sh
```

## 🆘 Troubleshooting

**Common Issues:**

1. **n8n won't start:**
   - Check if port 5678 is available
   - Look at `n8n.log` for errors

2. **Workflows fail:**
   - Check credentials are properly configured
   - Verify Google Sheets permissions
   - Check Sheet ID is correct

3. **No data syncing:**
   - Verify workflows are activated
   - Check webhook URLs are accessible
   - Review execution logs in n8n

**Get Help:**
- Check `n8n.log` for detailed errors
- Review `CREDENTIAL_SETUP_GUIDE.md` for detailed instructions
- Check n8n execution history for specific error messages

## 🎉 Success!

Your Yellow Box automation system is now running! You'll have:
- Automated data synchronization
- Regular backups
- Health monitoring
- Data integrity checks

All data will be automatically synced to your Google Sheets for easy reporting and analysis.

## Next Steps

- Set up email alerts for workflow failures
- Create custom reports from your Google Sheets data
- Monitor the system regularly using the monitoring script
- Scale your n8n instance for production use if needed