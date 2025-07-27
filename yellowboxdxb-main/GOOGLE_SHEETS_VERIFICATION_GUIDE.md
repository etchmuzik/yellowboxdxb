# Google Sheets Verification Guide - Yellow Box

## 🎯 Purpose
This guide helps you verify that data from the Yellow Box app is successfully flowing through n8n to your Google Sheets.

## 📊 Test Flow
```
Yellow Box App → Webhook → n8n → Google Sheets
     (1)           (2)       (3)       (4)
```

## 🧪 Running the End-to-End Test

### 1. Basic Test (Without Google Sheets API)
```bash
npm run test-sheets
```

This will:
- Send test data to n8n webhook ✅
- Wait for n8n to process the data
- Give you test IDs to manually check in Google Sheets

### 2. Advanced Test (With Google Sheets API)
```bash
# First install googleapis
npm install googleapis

# Run with your Sheet ID
GOOGLE_SHEET_ID=your-sheet-id-here npm run test-sheets
```

## 📋 Manual Verification Steps

### Step 1: Run the Test
```bash
npm run test-sheets
```

You'll see output like:
```
📤 Sending rider created webhook...
   ID: test_rider_1737730123456
✅ Webhook sent successfully (150ms)

📤 Sending expense created webhook...
   ID: test_expense_1737730123456
✅ Webhook sent successfully (148ms)

📤 Sending document created webhook...
   ID: test_doc_1737730123456
✅ Webhook sent successfully (152ms)
```

### Step 2: Note the Test IDs
The test creates unique IDs with timestamps:
- **Rider ID**: `test_rider_[timestamp]`
- **Expense ID**: `test_expense_[timestamp]`
- **Document ID**: `test_doc_[timestamp]`

### Step 3: Check n8n Execution History

1. Go to: https://n8n.srv924607.hstgr.cloud/
2. Open your workflow: "Yellow Box - Real-time Data Sync"
3. Click on "Executions" tab
4. Look for recent executions (should see 3 new ones)
5. Click on each execution to see:
   - ✅ Green = Success
   - ❌ Red = Error

### Step 4: Verify in Google Sheets

Open your Google Sheet and check each tab:

#### **Riders Tab**
Look for a new row with:
- ID: `test_rider_[timestamp]`
- Full Name: `Test Rider [timestamp]`
- Email: `test[timestamp]@yellowbox.ae`
- Application Stage: Applied

#### **Expenses Tab**
Look for a new row with:
- ID: `test_expense_[timestamp]`
- Rider ID: `test_rider_[timestamp]`
- Category: Fuel
- Amount: 150
- Status: pending

#### **Documents Tab**
Look for a new row with:
- ID: `test_doc_[timestamp]`
- Type: Visa
- Status: Pending
- File Name: test-visa.pdf

## 🔍 Troubleshooting

### ❌ Webhook Tests Pass but No Data in Sheets

**Possible Issues:**

1. **Workflow Not Active**
   - Check n8n workflow is toggled ON
   - Look for the active indicator in n8n

2. **Google Sheets Not Connected**
   - In n8n, check Google Sheets nodes
   - Ensure credentials are configured
   - Verify Sheet ID is set correctly

3. **Wrong Sheet Names**
   - Ensure tabs are named exactly: `Riders`, `Expenses`, `Documents`
   - Names are case-sensitive

4. **Permissions Issue**
   - Check Google Sheets is shared with n8n service account
   - Or OAuth permissions are granted

### ❌ Webhook Tests Fail

1. **Check n8n is Running**
   - Visit: https://n8n.srv924607.hstgr.cloud/
   - Should see n8n interface

2. **Verify Webhook URL**
   - Check `src/services/webhookService.ts`
   - Should be: `https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync`

3. **Network Issues**
   - Check internet connectivity
   - Try accessing n8n URL in browser

## 📈 What Success Looks Like

### In n8n Executions:
- ✅ 3 successful executions (one for each test)
- Each execution shows data flowing through all nodes
- No error messages

### In Google Sheets:
- ✅ New row in Riders tab with test data
- ✅ New row in Expenses tab with test data
- ✅ New row in Documents tab with test data
- Timestamps match your test run time

## 🚀 Advanced Setup (Optional)

### Enable Automated Verification

1. **Create Service Account**
   - Go to Google Cloud Console
   - Create new service account
   - Download JSON key
   - Save as `google-service-account.json`

2. **Share Sheet with Service Account**
   - Copy service account email
   - Share Google Sheet with this email (View access)

3. **Run Automated Test**
   ```bash
   GOOGLE_SHEET_ID=your-sheet-id npm run test-sheets
   ```

The test will automatically check if data appears in sheets!

## 📊 Sample Test Output

### Successful Integration:
```
📊 Yellow Box - Google Sheets Integration Test

1. Sending Test Data to n8n
──────────────────────────────────────────────────
📤 Sending rider created webhook...
   ID: test_rider_1737730123456
✅ Webhook sent successfully (150ms)

📤 Sending expense created webhook...
   ID: test_expense_1737730123456
✅ Webhook sent successfully (148ms)

📤 Sending document created webhook...
   ID: test_doc_1737730123456
✅ Webhook sent successfully (152ms)

2. Waiting for n8n Processing
──────────────────────────────────────────────────
⏳ Waiting 10 seconds for n8n to process...
✅ Wait complete

3. Test Summary
══════════════════════════════════════════════════

Webhook Tests:
  rider: ✅ Success (150ms)
  expense: ✅ Success (148ms)
  document: ✅ Success (152ms)

Test Data IDs:
  Rider ID: test_rider_1737730123456
  Expense ID: test_expense_1737730123456
  Document ID: test_doc_1737730123456

Next Steps:
1. Check n8n execution history
2. Verify data in Google Sheets
3. Search for the test IDs above
```

## 🎉 Confirming Full Integration

When everything is working:
1. ✅ Webhook tests pass (3/3)
2. ✅ n8n executions show success
3. ✅ Google Sheets contain test data
4. ✅ Real app operations sync automatically

Your Yellow Box app is now fully integrated with Google Sheets via n8n!

## 📞 Need Help?

1. Check n8n logs for detailed errors
2. Verify all webhook URLs match
3. Ensure Google Sheets permissions are correct
4. Test with simple webhook first: `npm run test-webhook`