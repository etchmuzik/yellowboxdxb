# Google Sheets Setup for Yellow Box n8n Integration

## Overview
This guide helps you set up Google Sheets to work with the Yellow Box n8n webhook integration for real-time data synchronization.

## 1. Create Google Sheet

### Create a new Google Sheet with these tabs:

1. **Riders** tab with columns:
   - A: ID
   - B: Timestamp
   - C: Action
   - D: Full Name
   - E: Email
   - F: Phone
   - G: Nationality
   - H: Visa Number
   - I: Application Stage
   - J: Bike Type
   - K: Assigned Bike ID
   - L: Theory Test
   - M: Road Test
   - N: Medical Test
   - O: Join Date
   - P: Notes

2. **Expenses** tab with columns:
   - A: ID
   - B: Timestamp
   - C: Action
   - D: Rider ID
   - E: Rider Name
   - F: Category
   - G: Amount (AED)
   - H: Date
   - I: Description
   - J: Status
   - K: Receipt URL
   - L: Approved At
   - M: Rejected At
   - N: Rejection Reason

3. **Documents** tab with columns:
   - A: ID
   - B: Timestamp
   - C: Action
   - D: Rider ID
   - E: Type
   - F: File Name
   - G: File URL
   - H: Upload Date
   - I: Expiry Date
   - J: Status
   - K: Notes

4. **Logs** tab with columns:
   - A: Timestamp
   - B: Event Type
   - C: Details
   - D: Status

## 2. Get Sheet ID

1. Open your Google Sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
3. Copy the `SHEET_ID` part

## 3. Configure n8n Google Sheets Connection

### In n8n:

1. **Add Google Sheets credentials**:
   - Go to Credentials → Add Credential → Google Sheets OAuth2 API
   - Click "Connect my account"
   - Authorize n8n to access your Google Sheets
   - Save the credentials

2. **Update the workflow**:
   - Replace `YOUR_GOOGLE_SHEET_ID` with your actual Sheet ID in all Google Sheets nodes
   - Ensure the ranges match your sheet structure:
     - Riders: `Riders!A:P`
     - Expenses: `Expenses!A:N`
     - Documents: `Documents!A:K`

## 4. Import and Configure Workflow

### Steps:
1. Open n8n (http://localhost:5678)
2. Click "Add workflow" → "Import from File"
3. Select `yellowbox-realtime-sync.json`
4. Update all Google Sheets nodes with your Sheet ID
5. Save the workflow
6. **Activate the workflow** (toggle switch ON)

## 5. Test the Integration

Run the webhook test to verify everything works:

```bash
npm run test-webhook
```

You should see:
- Test data appearing in your Google Sheets
- Success responses in the terminal
- New rows added to appropriate tabs

## 6. Sheet Formulas (Optional)

### Add these helpful formulas:

**In Riders tab (Row 1)**:
```
={"Total Riders"; COUNTA(A2:A)}
={"Active"; COUNTIF(I2:I, "Active")}
```

**In Expenses tab (Row 1)**:
```
={"Total Expenses"; COUNTA(A2:A)}
={"Total Amount"; SUM(G2:G)}
={"Pending"; COUNTIF(J2:J, "pending")}
```

**In Documents tab (Row 1)**:
```
={"Total Documents"; COUNTA(A2:A)}
={"Valid"; COUNTIF(J2:J, "Valid")}
={"Expired"; COUNTIF(J2:J, "Expired")}
```

## 7. Advanced Setup

### Create a Dashboard Tab:

1. Add a new tab called "Dashboard"
2. Use formulas to create summary views:

```
=QUERY(Riders!A:P, "SELECT I, COUNT(A) GROUP BY I LABEL COUNT(A) 'Count'", 1)
```

### Set up Conditional Formatting:

1. **Riders tab**: Highlight "Active" riders in green
2. **Expenses tab**: Highlight "rejected" in red, "approved" in green
3. **Documents tab**: Highlight "Expired" in red

## 8. Troubleshooting

### Common Issues:

1. **"Range not found" error**:
   - Ensure tab names match exactly (case-sensitive)
   - Check column ranges are correct

2. **"Authentication failed"**:
   - Re-authenticate Google Sheets in n8n credentials
   - Check OAuth scopes include sheets access

3. **Data not appearing**:
   - Verify workflow is activated
   - Check webhook test shows success
   - Look at n8n execution history for errors

## 9. Production Considerations

1. **Sheet Permissions**:
   - Share sheet with service account (if using service account auth)
   - Set appropriate view/edit permissions

2. **Data Retention**:
   - Consider archiving old data periodically
   - Set up automatic backups

3. **Performance**:
   - Google Sheets has limits (10 million cells)
   - Consider moving to database for large datasets

## 10. Next Steps

1. Set up additional n8n workflows:
   - Scheduled backups (ID: mpchfdzgAVmAVlVU)
   - Health monitoring (ID: yz8EHQamhw1mb8Sx)
   - Data integrity checks (ID: LGoTcdR0z8xMHYSW)

2. Create Google Data Studio dashboards using the sheet data

3. Set up email notifications for critical events