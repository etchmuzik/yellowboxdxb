# 🚀 N8N Workflow Import Guide

## 📁 **Complete Workflow JSON**
File: `COMPLETE_N8N_WORKFLOW.json`

This is a complete, ready-to-import N8N workflow that fixes all the issues identified in our MCP analysis.

## 🔧 **How to Import**

### Method 1: Import Complete Workflow (Recommended)
1. Go to your N8N instance: `https://n8n.srv924607.hstgr.cloud`
2. Click **"+ New Workflow"** or **"Import from File"**
3. Upload the `COMPLETE_N8N_WORKFLOW.json` file
4. Configure Google Sheets credentials (see below)
5. Activate the workflow

### Method 2: Fix Existing Workflow
If you want to fix the existing workflow instead:

#### Fix Webhook Trigger Node:
```json
{
  "httpMethod": "POST",
  "path": "yellowbox-sync",
  "responseMode": "onReceived",
  "responseData": "firstEntryJson",
  "responseCode": 200
}
```

#### Fix Google Sheets Node:
```json
{
  "operation": "appendOrUpdate",
  "columns": {
    "matchingColumns": [
      {
        "field": "id"
      }
    ]
  }
}
```

## 🔑 **Google Sheets Setup**

### 1. Create Google Sheets Credential
1. In N8N, go to **Credentials** → **Add Credential**
2. Select **Google Sheets API**
3. Follow the OAuth setup process
4. Name it: `Google Sheets API`

### 2. Create/Configure Google Sheet
Create a Google Sheet with these tabs:

**Sheet 1 (Riders)** - Headers:
```
id | name | email | phone | status | timestamp | visaNumber | licenseNumber | expectedStartDate
```

**Sheet 2 (Expenses)** - Headers:
```
id | riderId | type | amount | description | status | timestamp | receiptUrl
```

### 3. Update Sheet ID
In the workflow, replace this Google Sheets document ID:
```
Current: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
Replace with: YOUR_GOOGLE_SHEET_ID
```

## ✅ **Key Features Fixed**

### 1. Webhook Trigger Node
- ✅ HTTP Method: POST
- ✅ Path: yellowbox-sync  
- ✅ Response configuration
- ✅ Proper webhook ID

### 2. Google Sheets Integration
- ✅ "Column to Match On" set to "id"
- ✅ Append or Update operation
- ✅ Proper field mapping
- ✅ Error handling

### 3. Data Flow Logic
- ✅ Conditional routing (rider vs expense data)
- ✅ Proper success/error responses
- ✅ JSON response formatting

## 🧪 **Test After Import**

Run this test to verify everything works:
```bash
node test-n8n-webhook-status.js
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Data synced successfully",
  "type": "rider",
  "id": "test-rider-001",
  "timestamp": "2025-07-24T17:51:27.493Z"
}
```

## 🔧 **Troubleshooting**

### If Import Fails:
1. Check N8N version compatibility
2. Ensure Google Sheets credential is set up
3. Verify Google Sheet permissions
4. Check N8N server logs

### If Webhook Still Fails:
1. Verify workflow is activated
2. Check webhook URL path matches
3. Test with simple curl command
4. Review N8N execution logs

## 📋 **Workflow Structure**

```
Webhook Trigger (POST /yellowbox-sync)
    ↓
Check Data Type (rider/expense)
    ↓                    ↓
Sync Rider Data    Check Expense Type
    ↓                    ↓
Success Response   Sync Expense Data → Success Response
                        ↓
                   Error Response (unknown type)
```

## 🎯 **Next Steps**

1. Import the workflow
2. Configure Google Sheets credentials
3. Update Google Sheet ID
4. Activate workflow
5. Test with Yellow Box integration
6. Monitor execution logs

---

**File**: `COMPLETE_N8N_WORKFLOW.json`  
**Status**: Ready for import  
**Fixes**: All MCP-identified issues resolved  
**Test Command**: `node test-n8n-webhook-status.js`