# Yellow Box - Google Sheets Setup Guide for n8n

## Why Data Isn't Appearing in Google Sheets

The n8n workflow template has placeholder values that need to be configured:

### Issues Found:
1. **Google Sheet ID**: Currently set to `YOUR_GOOGLE_SHEET_ID`
2. **Credentials**: Set to `YOUR_GOOGLE_SHEETS_CREDENTIAL_ID`
3. **Workflow Status**: Set to `"active": false`
4. **Field Mappings**: May not match your webhook data structure

## Quick Fix Steps

### Step 1: Get Your Google Sheet ID
1. Open your Google Sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
3. Copy the SHEET_ID part (looks like: `1ABC123def456...`)

### Step 2: Configure n8n Workflow
1. Log into n8n: https://n8n.srv924607.hstgr.cloud/
2. Open workflow: "Yellow Box - Real-time Data Sync"
3. For EACH Google Sheets node:
   - Click on the node
   - Replace `YOUR_GOOGLE_SHEET_ID` with your actual Sheet ID
   - Configure credentials (see below)

### Step 3: Set Up Google Sheets Credentials
1. In n8n, go to Credentials
2. Create new "Google Sheets API" credential
3. Choose authentication method:
   - **OAuth2** (easier) - Sign in with Google
   - **Service Account** (more secure) - Upload JSON key

### Step 4: Fix Field Mappings
The webhook sends data like this:
```json
{
  "type": "rider",
  "data": {
    "id": "test_rider_123",
    "fullName": "Test Rider",     // Not "name"
    "email": "test@yellowbox.ae",
    "phone": "+971501234567",
    "applicationStage": "Applied", // Not "status"
    "visaNumber": "TEST-123"
  }
}
```

But the workflow expects:
- `name` → Change to `fullName`
- `status` → Change to `applicationStage`

### Step 5: Create Required Sheet Tabs
Your Google Sheet needs these exact tab names:
- `Riders`
- `Expenses`
- `Documents`
- `Sync_Log`

### Step 6: Activate the Workflow
1. After configuration, toggle the workflow to "Active"
2. The toggle is in the top-right of the workflow editor

## Testing After Setup

Run this command to test:
```bash
npm run test-sheets
```

## Field Mapping Corrections

### For Rider Router node:
Change the field mappings:
```
B: {{ $json.data.fullName }}      // was "name"
E: {{ $json.data.applicationStage }} // was "status"
```

### For Expense Router node:
The data structure should match:
```
C: {{ $json.data.amountAed }}     // was "amount"
```

## Quick n8n Test

To test directly in n8n:
1. Click "Execute Workflow" 
2. Use this test data in the webhook trigger:
```json
{
  "type": "rider",
  "id": "test_123",
  "action": "created",
  "data": {
    "id": "test_123",
    "fullName": "Test User",
    "email": "test@example.com",
    "phone": "+971501234567",
    "applicationStage": "Applied",
    "visaNumber": "V123456"
  }
}
```

## Common Issues

1. **"No credentials set"** - Add Google Sheets credentials
2. **"Sheet not found"** - Check tab names are exact
3. **"Cannot read property"** - Fix field mappings
4. **"Unauthorized"** - Share sheet with service account email

## Need Help?

1. Check n8n execution logs for specific errors
2. Test webhook connection: `npm run test-webhook`
3. Verify sheet permissions and sharing settings