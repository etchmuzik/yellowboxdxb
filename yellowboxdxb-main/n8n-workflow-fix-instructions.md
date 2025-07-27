# n8n Workflow Fix Instructions for Yellow Box

## Workflow URL
https://n8n.srv924607.hstgr.cloud/workflow/4MEfKjDQsVJLmIod

## Required Fixes

### 1. Fix "Rider Router" Node (Route by Type)

**Current Issue**: The condition in the "Route by Type" node has an incorrect right value.

**Steps to Fix**:
1. Click on the "Route by Type" node to edit it
2. Look for the routing rules/conditions
3. Find the rule where:
   - Left Value: `{{ $json.body.type }}`
   - Right Value: `=rider {{ $json.body.type }}` ❌ (INCORRECT)
4. Change the Right Value to just: `rider` ✅
5. Make sure the operation is "equals"

**Correct Configuration**:
```
Rule 1:
- Field/Left Value: {{ $json.body.type }}
- Operation: equals
- Value/Right Value: rider

Rule 2:
- Field/Left Value: {{ $json.body.type }}
- Operation: equals
- Value/Right Value: expense

Rule 3:
- Field/Left Value: {{ $json.body.type }}
- Operation: equals
- Value/Right Value: document

Rule 4:
- Field/Left Value: {{ $json.body.type }}
- Operation: equals
- Value/Right Value: test
```

### 2. Fix "Process Rider Data" Node

**Current Issue**: The rider_id field is incorrectly mapped to `{{ $json.body.type }}`.

**Steps to Fix**:
1. Click on the "Process Rider Data" node (Code node)
2. Update the JavaScript code to fix the rider_id mapping
3. Replace the current code with:

```javascript
// Process Rider Data
const item = $input.first();
const { data, action, id, timestamp } = item.json.body;

// Prepare row data for Google Sheets
const row = {
  id: id,
  timestamp: timestamp,
  action: action,
  fullName: data.fullName || '',
  email: data.email || '',
  phone: data.phone || '',
  nationality: data.nationality || '',
  visaNumber: data.visaNumber || '',
  applicationStage: data.applicationStage || '',
  bikeType: data.bikeType || '',
  assignedBikeId: data.assignedBikeId || '',
  theoryTest: data.testStatus?.theory || '',
  roadTest: data.testStatus?.road || '',
  medicalTest: data.testStatus?.medical || '',
  joinDate: data.joinDate || '',
  notes: data.notes || ''
};

return { json: row };
```

### 3. Update Other Processing Nodes

For consistency, also update the "Process Expense Data" and "Process Document Data" nodes:

**Process Expense Data**:
```javascript
// Process Expense Data
const item = $input.first();
const { data, action, id, timestamp } = item.json.body;

// Prepare row data for Google Sheets
const row = {
  id: id,
  timestamp: timestamp,
  action: action,
  riderId: data.riderId || '',
  riderName: data.riderName || '',
  category: data.category || '',
  amountAed: data.amountAed || 0,
  date: data.date || '',
  description: data.description || '',
  status: data.status || '',
  receiptUrl: data.receiptUrl || '',
  approvedAt: data.approvedAt || '',
  rejectedAt: data.rejectedAt || '',
  rejectionReason: data.rejectionReason || ''
};

return { json: row };
```

**Process Document Data**:
```javascript
// Process Document Data
const item = $input.first();
const { data, action, id, timestamp } = item.json.body;

// Prepare row data for Google Sheets
const row = {
  id: id,
  timestamp: timestamp,
  action: action,
  riderId: data.riderId || '',
  type: data.type || '',
  fileName: data.fileName || '',
  fileUrl: data.fileUrl || '',
  uploadDate: data.uploadDate || '',
  expiryDate: data.expiryDate || '',
  status: data.status || '',
  notes: data.notes || ''
};

return { json: row };
```

### 4. Activate the Workflow

**IMPORTANT**: After making all the fixes, ensure the workflow is ACTIVE:
1. Look for the toggle switch at the top of the workflow
2. Make sure it's switched ON (Active)
3. Save the workflow

## Testing the Fix

After making these changes, test the workflow using this curl command:

```bash
curl -X POST https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync \
  -H "Content-Type: application/json" \
  -d '{
    "type": "rider",
    "action": "create",
    "id": "test_rider_fix_001",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "data": {
      "id": "test_rider_fix_001",
      "fullName": "Test Rider Fix",
      "email": "testfix@yellowbox.ae",
      "phone": "+971501234567",
      "applicationStage": "active"
    }
  }'
```

## Verification

1. Check the n8n execution history for successful runs
2. Verify data appears in the Google Sheets:
   - Riders Sheet: `1vAHRvoB3PCsr66Z0uT6M_4LgK3B1acIdUun_zl8GFx8`
   - Check that the rider_id column shows "test_rider_fix_001" (not "rider")

## Summary of Changes

1. ✅ Fix "Route by Type" node: Change right value from `=rider {{ $json.body.type }}` to `rider`
2. ✅ Fix "Process Rider Data" node: Change data extraction to use `item.json.body` structure
3. ✅ Update other processing nodes for consistency
4. ✅ Activate the workflow
5. ✅ Test with the provided curl command

## Need Help?

If you encounter any issues:
1. Check the n8n execution logs for error details
2. Verify the webhook URL is correct: `https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync`
3. Ensure Google Sheets credentials are properly configured
4. Make sure the workflow is active