# Yellow Box N8N Webhook Integration Guide

## Quick Setup

### 1. Automated Setup
```bash
# Run the automated setup script
./setup-webhook-integration.sh
```

### 2. Manual Setup Steps

#### Install and Start N8N
```bash
# Install N8N globally
npm install -g n8n

# Start N8N
n8n start
```

#### Import Workflows
1. Open N8N: http://localhost:5678
2. Go to Workflows → Import from File
3. Import all JSON files from `n8n-workflows/` directory
4. Activate all workflows

#### Test Integration
```bash
# Test webhook connectivity
npm run test-webhook

# Or use the test script directly
node test-webhook-connection.js
```

## Webhook URL
```
http://localhost:5678/webhook/yellowbox-sync
```

## Integration Points

### 1. Frontend Services
The following services now automatically trigger webhooks:

- **Rider Service** (`src/services/riderService.ts`)
  - `createRider()` → triggers 'created' webhook
  - `updateRider()` → triggers 'updated' webhook  
  - `deleteRider()` → triggers 'deleted' webhook

- **Expense Service** (`src/services/expenseService.ts`)
  - `createExpense()` → triggers 'created' webhook
  - `updateExpense()` → triggers 'updated' webhook
  - `approveExpense()` → triggers 'updated' webhook
  - `rejectExpense()` → triggers 'updated' webhook
  - `deleteExpense()` → triggers 'deleted' webhook

- **Document Service** (`src/services/documentService.ts`)
  - `uploadDocument()` → triggers 'created' webhook
  - `updateDocumentStatus()` → triggers 'updated' webhook
  - `deleteDocument()` → triggers 'deleted' webhook

### 2. Firebase Functions
Server-side triggers for Firestore changes:

- **Riders Collection** (`functions/src/webhooks.js`)
  - Triggers on any change to `riders/{riderId}`
  
- **Expenses Collection**
  - Triggers on any change to `expenses/{expenseId}`
  
- **Documents Collection**
  - Triggers on any change to `rider_documents/{documentId}`

### 3. Webhook Service
Central webhook management (`src/services/webhookService.ts`):

```typescript
// Single sync
await triggerSync('rider', riderId, 'created', riderData);

// Batch sync
await triggerBatchSync([
  { type: 'rider', id: 'rider1', action: 'created', data: rider1Data },
  { type: 'expense', id: 'expense1', action: 'updated', data: expense1Data }
]);

// Test connectivity
const isConnected = await testWebhook();
```

## Payload Format

### Standard Webhook Payload
```json
{
  "type": "rider|expense|document",
  "id": "record-id",
  "action": "created|updated|deleted",
  "data": {
    // Full record data
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "source": "frontend|firebase-function"
}
```

### Batch Payload
```json
{
  "batch": true,
  "items": [
    {
      "type": "rider",
      "id": "rider-123",
      "action": "created",
      "data": { /* rider data */ },
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Testing

### 1. Frontend Test Panel
Access the webhook test panel in the admin interface:
- Component: `src/components/admin/WebhookTestPanel.tsx`
- Tests connectivity, rider sync, expense sync, and document sync

### 2. Command Line Testing
```bash
# Run all connectivity tests
npm run test-webhook

# Test specific webhook manually
curl -X POST http://localhost:5678/webhook/yellowbox-sync \
  -H "Content-Type: application/json" \
  -d '{
    "type": "test",
    "id": "test-123",
    "action": "ping",
    "data": {"message": "Hello N8N"},
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
  }'
```

### 3. Firebase Functions Testing
```bash
# Test Firebase Functions webhook endpoint
curl -X POST https://your-project.cloudfunctions.net/webhookHealthCheck

# Manual sync trigger
curl -X POST https://your-project.cloudfunctions.net/manualSync \
  -H "Content-Type: application/json" \
  -d '{
    "type": "rider",
    "id": "rider-123",
    "action": "created",
    "data": {"name": "Test Rider"}
  }'
```

## Troubleshooting

### Common Issues

1. **Webhook Connection Failed**
   - Check if N8N is running: `curl http://localhost:5678/healthz`
   - Verify webhook URL in N8N workflow
   - Check firewall/network settings

2. **Workflows Not Triggering**
   - Ensure workflows are activated in N8N
   - Check webhook node configuration
   - Verify Google Sheets credentials

3. **Data Not Syncing**
   - Check N8N execution logs
   - Verify Google Sheets permissions
   - Check payload format in webhook logs

### Debug Commands
```bash
# Check N8N status
curl http://localhost:5678/healthz

# View N8N logs
tail -f ~/.n8n/n8n.log

# Test webhook with verbose output
node test-webhook-connection.js

# Check Firebase Functions logs
firebase functions:log
```

### N8N Workflow Status
```bash
# Check if workflows are active
# Open N8N UI: http://localhost:5678
# Go to Workflows and verify all are "Active"
```

## Configuration

### Environment Variables
```bash
# .env.automation
N8N_WEBHOOK_URL=http://localhost:5678/webhook/yellowbox-sync
N8N_HOST=localhost
N8N_PORT=5678
ENABLE_WEBHOOK_SYNC=true
WEBHOOK_TIMEOUT=10000
BATCH_SYNC_ENABLED=true
BATCH_SYNC_SIZE=10
BATCH_SYNC_DELAY=1000
```

### Firebase Functions Environment
```bash
# Set webhook URL for Firebase Functions
firebase functions:config:set webhook.url="http://localhost:5678/webhook/yellowbox-sync"

# Deploy functions
firebase deploy --only functions
```

## Monitoring

### 1. N8N Execution History
- Open N8N UI: http://localhost:5678
- Go to Executions to view webhook triggers
- Check for failed executions and error details

### 2. Google Sheets Logs
Check the following sheets for sync activity:
- `Sync_Log` - Real-time sync activities
- `Backup_Log` - Scheduled backup activities  
- `Health_Log` - Application health monitoring
- `Data_Integrity_Log` - Daily integrity checks

### 3. Browser Console
Monitor webhook calls in browser developer tools:
- Network tab shows webhook requests
- Console shows success/error messages

## Production Deployment

### 1. Update Webhook URL
For production, update the webhook URL in:
- `src/services/webhookService.ts`
- `functions/src/webhooks.js`
- N8N workflow configuration

### 2. Security Considerations
- Use HTTPS for webhook URLs
- Implement webhook signature verification
- Restrict N8N access with authentication
- Use environment variables for sensitive data

### 3. Scaling
- Consider using N8N cloud for production
- Implement webhook queuing for high volume
- Monitor webhook performance and timeouts
- Set up proper error handling and retries

## Support

For issues or questions:
1. Check N8N documentation: https://docs.n8n.io
2. Review workflow execution logs in N8N UI
3. Test connectivity using provided test scripts
4. Check Firebase Functions logs for server-side issues

---

**Last Updated**: January 2024  
**Version**: 1.0.0