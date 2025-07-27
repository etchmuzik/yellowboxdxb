# Step-by-Step Fix for N8N Google Sheets Error

## 🚨 Error Details
- **Execution**: https://n8n.srv924607.hstgr.cloud/workflow/sm5RUQQwjr2cR4mB/executions/115
- **Error**: "The 'Column to Match On' parameter is required"
- **Node**: "Sync Expense Data1"
- **Type**: Google Sheets configuration error

## 🔧 Visual Fix Guide

### Step 1: Access N8N Workflow
```
1. Open browser
2. Go to: https://n8n.srv924607.hstgr.cloud
3. Login with your credentials
4. Navigate to workflow: sm5RUQQwjr2cR4mB
```

### Step 2: Locate the Error Node
```
Look for the node named "Sync Expense Data1"
- It should be highlighted in RED (error state)
- It's a Google Sheets node
- Click on it to open configuration
```

### Step 3: Fix the Configuration
In the node configuration panel, you'll see these fields:

```
┌─────────────────────────────────────┐
│ Google Sheets Node Configuration    │
├─────────────────────────────────────┤
│ Operation: Append or Update ✓       │
│ Document ID: [Your Sheets ID] ✓     │
│ Sheet Name: Expenses ✓              │
│ Range: A:J ✓                        │
│ Column to Match On: [EMPTY] ❌      │ ← FIX THIS
└─────────────────────────────────────┘
```

**REQUIRED FIX**: In the "Column to Match On" field, enter: `id`

### Step 4: Configure Column Mappings
Ensure the Columns section has these mappings:

```json
{
  "id": "={{ $json.data.id }}",
  "riderId": "={{ $json.data.riderId }}",
  "riderName": "={{ $json.data.riderName }}",
  "amount": "={{ $json.data.amount }}",
  "category": "={{ $json.data.category }}",
  "description": "={{ $json.data.description }}",
  "status": "={{ $json.data.status }}",
  "receiptUrl": "={{ $json.data.receiptUrl }}",
  "submittedDate": "={{ $json.data.submittedDate }}",
  "createdAt": "={{ $json.data.createdAt }}"
}
```

### Step 5: Prepare Google Sheets
Your Google Sheets document should have these headers in Row 1:

```
| A  | B       | C         | D      | E        | F           | G      | H          | I             | J         |
|----|---------|-----------|--------|----------|-------------|--------|------------|---------------|-----------|
| id | riderId | riderName | amount | category | description | status | receiptUrl | submittedDate | createdAt |
```

### Step 6: Save and Test
1. **Save** the workflow in N8N
2. **Activate** the workflow
3. **Test** by running: `node test-complete-google-sheets-flow.js`

## 🎯 Expected Result After Fix

### Before Fix:
```
Webhook → N8N → ❌ Google Sheets Error
                   "Column to Match On parameter required"
```

### After Fix:
```
Webhook → N8N → ✅ Google Sheets Success
                   Data saved to spreadsheet
```

## 🔍 Verification Checklist

After applying the fix:
- [ ] "Column to Match On" field is set to `id`
- [ ] Google Sheets has proper headers
- [ ] Workflow is saved and activated
- [ ] Test script runs without errors
- [ ] Data appears in Google Sheets
- [ ] No more execution errors in N8N

## 🚨 If Error Persists

Check these additional items:
1. **Authentication**: Service account has access to Google Sheets
2. **API Access**: Google Sheets API is enabled
3. **Permissions**: Sheet is shared with service account email
4. **Sheet Name**: Matches exactly (case-sensitive)
5. **Range**: Includes all necessary columns

## 📞 Quick Test Command

After fixing, run this to verify:
```bash
node test-complete-google-sheets-flow.js
```

This will send test data and verify it reaches Google Sheets successfully.

---

**The fix is simple**: Just add `id` to the "Column to Match On" field in the Google Sheets node configuration!