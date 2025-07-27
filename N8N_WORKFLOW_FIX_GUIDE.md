# 🚨 N8N Workflow Fix Guide - Step by Step

## Current Issue
The N8N workflow with ID `sm5RUQQwjr2cR4mB` returns 404 - it doesn't exist or was deleted. The webhook endpoint `/webhook/yellowbox-sync` returns 500 error.

## 🛠️ Step-by-Step Fix Instructions

### Step 1: Access N8N Dashboard
1. Open your browser and go to: `https://n8n.srv924607.hstgr.cloud`
2. Log in with your N8N credentials

### Step 2: Import the Complete Workflow

1. **In N8N Dashboard:**
   - Click on "Workflows" in the left sidebar
   - Click the "Add workflow" button (+ icon)
   - Select "Import from File" or "Import from JSON"

2. **Copy the complete workflow JSON:**
   - Open the file: `/Users/etch/Downloads/yellowbox/COMPLETE_N8N_WORKFLOW.json`
   - Copy the entire contents (480 lines)
   - Or download it from the Yellow Box repository
   
3. **Paste the JSON** into the import dialog
4. Click "Import"

### Step 3: Configure Google Sheets Credentials

1. **In the imported workflow:**
   - Find any Google Sheets nodes
   - Click on each Google Sheets node
   - Click on "Credential for Google Sheets API"

2. **Create new credentials:**
   - Click "Create New"
   - Choose "Google Sheets API" 
   - Select "OAuth2" as authentication method
   - Follow the OAuth2 setup:
     - Client ID: (from Google Cloud Console)
     - Client Secret: (from Google Cloud Console)
     - Click "Connect my account"
     - Authorize access to Google Sheets

3. **Test the connection:**
   - In the Google Sheets node, click "Test" 
   - Ensure it says "Connection successful"

### Step 4: Update Webhook URL in Web App

1. **After activating the workflow in N8N:**
   - Click on the Webhook node
   - Copy the generated webhook URL (it will look like: `https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync`)

2. **Update your web app configuration:**
   - The webhook URL is already configured in the web app
   - If needed, update the `.env` file:
   ```env
   VITE_N8N_WEBHOOK_URL=https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync
   ```

### Step 5: Activate the Workflow

1. **In N8N:**
   - Toggle the "Active" switch in the top right
   - The workflow should show as "Active"
   - The webhook will now be listening for requests

### Step 6: Test the Integration

Run this test from your terminal:

```bash
curl -X POST https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "test_connection",
    "data": {
      "message": "Testing Yellow Box N8N Integration",
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }
  }'
```

**Expected response:**
```json
{
  "status": "success",
  "message": "Webhook received",
  "operation": "test_connection"
}
```

### Step 7: Verify in Yellow Box Web App

1. Go to your Yellow Box app
2. Create a new rider or expense
3. Check N8N executions to see if data is flowing
4. Check Google Sheets for synchronized data

## 🔍 Troubleshooting

### If webhook returns 404:
- Workflow is not active
- Webhook path is incorrect
- Workflow was deleted

### If webhook returns 500:
- Workflow has errors
- Google Sheets credentials not configured
- Node configuration issues

### If data doesn't appear in Google Sheets:
- Check Google Sheets permissions
- Verify spreadsheet ID is correct
- Check column mappings match

## ✅ Success Indicators

1. Webhook returns 200 status
2. N8N execution history shows successful runs
3. Data appears in Google Sheets
4. No errors in Yellow Box console

## 📞 Quick Test Commands

Test rider sync:
```bash
node /Users/etch/Downloads/yellowbox/test-n8n-webhook-status.js
```

Test complete workflow:
```bash
node /Users/etch/Downloads/yellowbox/n8n-workflow-verification-test.js
```

## 🚀 Next Steps

Once N8N is working:
1. Set up the MCP server for real-time features
2. Configure monitoring workflows
3. Enable advanced analytics