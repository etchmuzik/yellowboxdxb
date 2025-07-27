# 🚨 CRITICAL: N8N Workflow Fix Guide - Yellow Box System Restoration

## ⚠️ **SYSTEM STATUS**: BROKEN - Immediate Action Required

**Current Issues**:
- ❌ Webhook endpoint returning 500 errors
- ❌ Workflow ID `sm5RUQQwjr2cR4mB` not found (404)
- ❌ Google Sheets node missing "Column to Match On" parameter
- ❌ Complete automation failure

## 🎯 **SOLUTION: 20-Minute Complete Fix**

### **STEP 1: Access N8N (2 minutes)**
1. Go to: `https://n8n.srv924607.hstgr.cloud`
2. Login to your N8N instance
3. You should see your dashboard

### **STEP 2: Import Complete Working Workflow (5 minutes)**

**Option A: Import Ready-Made Workflow (RECOMMENDED)**
1. Click **"+ New Workflow"** or **"Import from File"**
2. Upload the file: `COMPLETE_N8N_WORKFLOW.json` (located in your project root)
3. The workflow will load with all nodes pre-configured
4. Skip to Step 4 (Google Sheets Setup)

**Option B: Fix Existing Workflow (If you prefer)**
1. Find your existing workflow (if visible)
2. OR create a new workflow manually
3. Follow the manual configuration below

### **STEP 3: Manual Workflow Configuration (If not importing)**

#### A. Add Webhook Trigger Node
1. Add a **"Webhook"** trigger node
2. Configure it exactly as follows:
```json
{
  "httpMethod": "POST",
  "path": "yellowbox-sync",
  "responseMode": "onReceived",
  "responseData": "firstEntryJson",
  "responseCode": 200
}
```

#### B. Add Data Processing Logic
1. Add an **"IF"** node to check data type
2. Condition: `{{ $json.operation }}` contains `rider`

#### C. Add Google Sheets Nodes
**For Riders Data**:
1. Add **"Google Sheets"** node
2. Configure:
```json
{
  "operation": "appendOrUpdate",
  "documentId": "YOUR_GOOGLE_SHEET_ID",
  "sheetName": "Riders",
  "columns": {
    "matchingColumns": [{"field": "id"}]
  }
}
```

**For Expenses Data**:
1. Add another **"Google Sheets"** node  
2. Configure:
```json
{
  "operation": "appendOrUpdate",
  "documentId": "YOUR_GOOGLE_SHEET_ID", 
  "sheetName": "Expenses",
  "columns": {
    "matchingColumns": [{"field": "id"}]
  }
}
```

### **STEP 4: Google Sheets Setup (8 minutes)**

#### A. Create Google Sheets API Credential
1. In N8N, go to **"Credentials"** → **"Add Credential"**
2. Select **"Google Sheets API"**
3. Choose **"OAuth2"** authentication
4. Follow the OAuth setup process:
   - You'll be redirected to Google
   - Grant permissions to N8N
   - Copy the generated credential
5. Name the credential: `Google Sheets API`

#### B. Create/Configure Your Google Sheet
1. Create a new Google Sheet or use existing
2. **Sheet Tab 1: "Riders"** - Add these headers in Row 1:
```
A1: id
B1: name  
C1: email
D1: phone
E1: status
F1: timestamp
G1: visaNumber
H1: licenseNumber
I1: expectedStartDate
J1: nationality
K1: dateOfBirth
L1: address
M1: emergencyContact
```

3. **Sheet Tab 2: "Expenses"** - Add these headers in Row 1:
```
A1: id
B1: riderId
C1: riderName
D1: amount
E1: category
F1: description
G1: status
H1: receiptUrl
I1: submittedDate
J1: createdAt
```

#### C. Update Workflow with Your Sheet ID
1. Get your Google Sheet ID from the URL:
   - URL: `https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit`
   - ID: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`
2. In each Google Sheets node, replace the Document ID with your sheet ID
3. Ensure the credential is selected for each Google Sheets node

### **STEP 5: Activate Workflow (2 minutes)**
1. **CRITICAL**: Click the **"Active"** toggle at the top of the workflow
2. The toggle should turn green/blue
3. You should see a webhook URL generated like:
   `https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync`

### **STEP 6: Test the Fix (3 minutes)**

#### A. Quick Test via N8N
1. In the workflow, click **"Test Workflow"**
2. Trigger the webhook manually
3. Check for successful execution

#### B. Test with Script
Run this from your project directory:
```bash
node test-n8n-webhook-status.js
```

**Expected Success Response**:
```json
{
  "success": true,
  "message": "Data synced successfully", 
  "type": "rider",
  "id": "test-rider-001",
  "timestamp": "2025-07-25T18:45:00.000Z"
}
```

#### C. Test with Yellow Box App
1. Go to your Yellow Box web app
2. Navigate to `/riders` page
3. Click **"Add New Rider"**
4. Fill out the form and submit
5. Check your Google Sheet - data should appear

## 🎯 **Success Indicators**

You'll know the fix worked when:
- ✅ Webhook returns 200 status instead of 500
- ✅ N8N workflow execution shows green checkmarks
- ✅ Data appears in your Google Sheets
- ✅ No "Column to Match On" errors in N8N logs
- ✅ Yellow Box app shows success notifications

## 🚨 **If You Still Get Errors**

### Error: "Workflow could not be started"
**Fix**: Ensure the workflow is **ACTIVATED** (toggle at top)

### Error: "Document not found"  
**Fix**: Check your Google Sheet ID is correct and sheet is shared

### Error: "Column to Match On is required"
**Fix**: In Google Sheets node, set "Column to Match On" to `id`

### Error: "Authentication failed"
**Fix**: Recreate the Google Sheets API credential

## 🔧 **Emergency Fallback**

If import fails completely:
1. Delete the broken workflow
2. Create a completely new workflow from scratch
3. Use the manual configuration steps above
4. Ensure each step is completed exactly as specified

## 📞 **Verification Checklist**

Before considering this complete, verify:
- [ ] N8N workflow is visible and activated
- [ ] Webhook URL is accessible (not 404)
- [ ] Google Sheets credential is configured
- [ ] Google Sheet has proper headers
- [ ] Test script returns 200 status
- [ ] Data appears in Google Sheets when tested
- [ ] Yellow Box app can add riders successfully

## 🎯 **Post-Fix Next Steps**

Once this critical fix is complete:
1. Update your team about restored functionality
2. Test all Yellow Box features end-to-end
3. Monitor the workflow for a few hours
4. Proceed to Firebase Functions deployment
5. Plan MCP server implementation

---

**PRIORITY**: 🚨 CRITICAL - Do this immediately  
**ESTIMATED TIME**: 20 minutes  
**SUCCESS CRITERIA**: Webhook returns 200, data syncs to Google Sheets  
**TEST COMMAND**: `node test-n8n-webhook-status.js`