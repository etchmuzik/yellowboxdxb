# N8N Webhook Testing Guide for Yellow Box

## Overview
This guide helps you test the webhook integration between Yellow Box and n8n for real-time data synchronization.

## Prerequisites
- Node.js 18+ (for native fetch support)
- n8n installed globally or running locally
- Yellow Box application configured

## Quick Start

### 1. Start n8n
```bash
# Install n8n globally (if not already installed)
npm install -g n8n

# Start n8n
npx n8n start
```

n8n will be available at: http://localhost:5678

### 2. Import the Workflow
1. Open n8n in your browser: http://localhost:5678
2. Click "Import from URL" or "Import from File"
3. Import the workflow with ID: `e91V8Vqp3fxl80PS`
4. The workflow name should be: "Real-time Data Sync"

### 3. Configure the Webhook
The webhook should be automatically configured as:
- **URL**: `/webhook/yellowbox-sync`
- **Method**: POST
- **Full URL**: `http://localhost:5678/webhook/yellowbox-sync`

### 4. Activate the Workflow
**Important**: Click the toggle switch to activate the workflow in n8n!

### 5. Run the Test
```bash
# From the Yellow Box project directory
npm run test-webhook
```

## Test Script Features

The test script (`test-webhook-connection.js`) performs:

1. **Connectivity Test**: Verifies n8n is running
2. **Basic Webhook Test**: Sends a test ping
3. **Data Type Tests**: Tests webhooks for:
   - Rider creation/update/deletion
   - Expense creation/update/deletion
   - Document creation/update/deletion
4. **Response Validation**: Checks response times and status codes

## Expected Output

### Successful Test
```
🔍 Checking if N8N is running...
✅ N8N is running and accessible
🚀 Starting N8N Webhook Connectivity Tests
🎯 Target URL: http://localhost:5678/webhook/yellowbox-sync
============================================================

🧪 Testing: Basic Connectivity Test
📤 Payload: {
  "type": "test",
  "id": "connectivity-test",
  "action": "ping",
  ...
}
✅ Success! Status: 200, Duration: 45ms

[Additional test results...]

📊 Test Results Summary:
============================================================
✅ PASS Basic Connectivity Test
   Duration: 45ms, Status: 200
✅ PASS Rider Creation Test
   Duration: 52ms, Status: 200
✅ PASS Expense Creation Test
   Duration: 48ms, Status: 200
✅ PASS Document Upload Test
   Duration: 51ms, Status: 200

============================================================
🎯 Overall Result: 4/4 tests passed
🎉 All tests passed! Webhook is working correctly.
============================================================
```

## Troubleshooting

### n8n Not Running
```
❌ N8N is not accessible. Make sure N8N is running on localhost:5678
```
**Solution**: Start n8n with `npx n8n start`

### Webhook Not Found (404)
```
❌ Failed: HTTP 404 Not Found
```
**Solution**: 
1. Check the workflow is imported in n8n
2. Verify the workflow is **activated** (toggle switch ON)
3. Confirm webhook URL is `/webhook/yellowbox-sync`

### Connection Refused
```
❌ Failed: fetch failed
```
**Solution**: 
1. Ensure n8n is running on port 5678
2. Check firewall settings
3. Try accessing http://localhost:5678 in browser

### Timeout Errors
```
❌ Failed: The operation was aborted
```
**Solution**: 
1. Check n8n logs for errors
2. Ensure workflow is not paused
3. Verify Google Sheets connection (if configured)

## Integration Points

The webhook service is integrated into:

### 1. Document Service (`src/services/documentService.ts`)
- Triggers on document upload
- Triggers on status updates
- Triggers on document deletion

### 2. Expense Service (`src/services/expenseService.ts`)
- Triggers on expense creation
- Triggers on expense approval/rejection
- Triggers on expense updates

### 3. Rider Service (`src/services/riderService.ts`)
- Triggers on rider registration
- Triggers on status changes
- Triggers on rider updates

## Webhook Payload Structure

```typescript
interface WebhookPayload {
  type: 'rider' | 'expense' | 'document';
  id: string;
  action: 'created' | 'updated' | 'deleted';
  data: any; // The full entity data
  timestamp: string; // ISO 8601 format
}
```

## Testing in Production

For production environments:

1. **Update Webhook URL**:
   ```javascript
   // src/services/webhookService.ts
   const WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/yellowbox-sync';
   ```

2. **Set Environment Variable**:
   ```bash
   N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/yellowbox-sync
   ```

3. **Test with Production URL**:
   ```bash
   WEBHOOK_URL=https://your-n8n-instance.com/webhook/yellowbox-sync npm run test-webhook
   ```

## Security Considerations

1. **Authentication**: Consider adding webhook authentication
2. **HTTPS**: Use HTTPS in production
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Validation**: Validate webhook payloads in n8n

## Next Steps

1. Monitor webhook performance in n8n execution history
2. Set up error notifications in n8n
3. Configure retry logic for failed webhooks
4. Implement webhook authentication for production