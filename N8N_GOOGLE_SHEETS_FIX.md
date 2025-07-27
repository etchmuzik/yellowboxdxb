# N8N Google Sheets Configuration Fix

## 🚨 Current Issue
The N8N workflow is failing with the error:
```
The 'Column to Match On' parameter is required
Problem in node 'Sync Expense Data1'
```

## 🔧 How to Fix

### Step 1: Access N8N Workflow Editor
1. Go to: `https://n8n.srv924607.hstgr.cloud`
2. Login to your N8N instance
3. Navigate to workflow ID: `sm5RUQQwjr2cR4mB`

### Step 2: Fix Google Sheets Node Configuration

#### For Rider Data Node:
1. Click on the **Google Sheets** node that handles rider data
2. In the **Operation** dropdown, ensure it's set to "Append or Update"
3. In the **Column to Match On** field, enter: `id`
4. Ensure the **Document ID** is set to your Google Sheets ID
5. Set the **Sheet Name** to the appropriate sheet (e.g., "Riders")
6. Configure the **Range** (e.g., "A:Z" or "A1:Z1000")

#### For Expense Data Node:
1. Click on the **Google Sheets** node that handles expense data (likely "Sync Expense Data1")
2. In the **Operation** dropdown, ensure it's set to "Append or Update"
3. In the **Column to Match On** field, enter: `id`
4. Ensure the **Document ID** is set to your Google Sheets ID
5. Set the **Sheet Name** to the appropriate sheet (e.g., "Expenses")
6. Configure the **Range** (e.g., "A:Z" or "A1:Z1000")

### Step 3: Column Mapping Configuration

#### Rider Data Columns:
```
Column A: id
Column B: name
Column C: email
Column D: phone
Column E: status
Column F: visaNumber
Column G: licenseNumber
Column H: expectedStartDate
Column I: createdAt
Column J: nationality
Column K: dateOfBirth
Column L: address
Column M: emergencyContact
```

#### Expense Data Columns:
```
Column A: id
Column B: riderId
Column C: riderName
Column D: amount
Column E: category
Column F: description
Column G: status
Column H: receiptUrl
Column I: submittedDate
Column J: createdAt
```

### Step 4: Data Mapping in N8N

For each Google Sheets node, configure the **Columns** section:

#### Rider Node Mapping:
```json
{
  "id": "{{ $json.data.id }}",
  "name": "{{ $json.data.name }}",
  "email": "{{ $json.data.email }}",
  "phone": "{{ $json.data.phone }}",
  "status": "{{ $json.data.status }}",
  "visaNumber": "{{ $json.data.visaNumber }}",
  "licenseNumber": "{{ $json.data.licenseNumber }}",
  "expectedStartDate": "{{ $json.data.expectedStartDate }}",
  "createdAt": "{{ $json.data.createdAt }}",
  "nationality": "{{ $json.data.nationality }}",
  "dateOfBirth": "{{ $json.data.dateOfBirth }}",
  "address": "{{ $json.data.address }}",
  "emergencyContact": "{{ $json.data.emergencyContact }}"
}
```

#### Expense Node Mapping:
```json
{
  "id": "{{ $json.data.id }}",
  "riderId": "{{ $json.data.riderId }}",
  "riderName": "{{ $json.data.riderName }}",
  "amount": "{{ $json.data.amount }}",
  "category": "{{ $json.data.category }}",
  "description": "{{ $json.data.description }}",
  "status": "{{ $json.data.status }}",
  "receiptUrl": "{{ $json.data.receiptUrl }}",
  "submittedDate": "{{ $json.data.submittedDate }}",
  "createdAt": "{{ $json.data.createdAt }}"
}
```

### Step 5: Google Sheets Setup

#### Create/Prepare Your Google Sheets:

1. **Riders Sheet** with headers:
   ```
   id | name | email | phone | status | visaNumber | licenseNumber | expectedStartDate | createdAt | nationality | dateOfBirth | address | emergencyContact
   ```

2. **Expenses Sheet** with headers:
   ```
   id | riderId | riderName | amount | category | description | status | receiptUrl | submittedDate | createdAt
   ```

### Step 6: Authentication Setup

1. Ensure Google Sheets API is enabled in your Google Cloud Console
2. Create service account credentials
3. Share your Google Sheets with the service account email
4. Configure the credentials in N8N

### Step 7: Test the Configuration

1. Save and activate the workflow in N8N
2. Run the test script: `node test-complete-google-sheets-flow.js`
3. Check your Google Sheets for the new data

## 🔍 Verification Checklist

- [ ] Google Sheets node has "Column to Match On" set to "id"
- [ ] Document ID is correct
- [ ] Sheet names match your Google Sheets tabs
- [ ] Column mappings are configured
- [ ] Workflow is saved and activated
- [ ] Google Sheets has proper headers
- [ ] Service account has access to the sheets

## 🚨 Common Issues and Solutions

### Issue: "Column to Match On" still required
**Solution**: Make sure you're using "Append or Update" operation, not just "Append"

### Issue: Authentication failed
**Solution**: 
1. Check service account credentials
2. Ensure sheets are shared with service account email
3. Verify Google Sheets API is enabled

### Issue: Data not appearing in sheets
**Solution**:
1. Check the sheet name matches exactly
2. Verify the range includes enough columns
3. Check column mappings in N8N

### Issue: Duplicate data
**Solution**: The "Column to Match On" should be set to a unique field like "id"

## 📞 Support

If you continue to have issues:
1. Check N8N execution logs
2. Verify Google Sheets permissions
3. Test with a simple data payload first
4. Use the N8N community forum for specific technical issues