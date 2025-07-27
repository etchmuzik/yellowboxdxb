# Yellow Box n8n Webhook Integration Guide

## Overview
This guide explains how to connect your Yellow Box application to n8n webhooks for real-time data collection and workflow automation.

## 1. n8n Webhook Setup

### Access Your Workflow
1. Log into n8n: https://n8n.srv924607.hstgr.cloud
2. Open workflow: https://n8n.srv924607.hstgr.cloud/workflow/4MEfKjDQsVJLmIod
3. Ensure the workflow is **Active** (toggle at top should be ON)

### Get Webhook URL
1. Click on the Webhook node in your workflow
2. Copy the **Production URL** (looks like: `https://n8n.srv924607.hstgr.cloud/webhook/YOUR_PATH`)
3. Note: Test URL is only for testing, Production URL works when workflow is active

## 2. Yellow Box Configuration

### Environment Variables
Add to your `.env` file:
```env
# n8n Webhook Configuration
VITE_N8N_WEBHOOK_URL=https://n8n.srv924607.hstgr.cloud/webhook/YOUR_ACTUAL_PATH
VITE_WEBHOOK_ENABLED=true
```

### Update Firebase Service Integration
The webhook service is already integrated. To use it in your existing services:

```typescript
import { webhookService } from '@/services/firebase/webhookService';

// Example: In riderFirestoreService.ts
async function createRider(riderData: RiderData) {
  // ... existing code ...
  
  // Send webhook notification
  await webhookService.onRiderRegistered(riderId, riderData);
}

// Example: In expenseFirestoreService.ts
async function submitExpense(expenseData: ExpenseData) {
  // ... existing code ...
  
  // Send webhook notification
  await webhookService.onExpenseSubmitted(expenseId, expenseData);
}
```

## 3. Events Tracked

### Rider Events
- `rider.registered` - New rider application
- `rider.status_changed` - Rider status update (Applied → Active)
- `rider.document_uploaded` - Document verification

### Expense Events
- `expense.submitted` - New expense submission
- `expense.approved` - Expense approved by finance
- `expense.rejected` - Expense rejected

### Bike Events
- `bike.assigned` - Bike assigned to rider
- `bike.unassigned` - Bike returned
- `bike.maintenance_required` - Maintenance issue reported

### Finance Events
- `finance.budget_allocated` - Monthly budget set

### System Events
- `system.user_logged_in` - User authentication
- `system.critical_error` - Application errors

## 4. Testing the Webhook

### Using Node.js Test Script
```bash
# Install dependencies
npm install axios

# Update webhook URL in webhook-test.js
# Run test
node webhook-test.js
```

### Using curl
```bash
curl -X POST https://n8n.srv924607.hstgr.cloud/webhook/YOUR_PATH \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2024-01-01T12:00:00Z",
    "source": "yellow-box",
    "type": "test",
    "data": {
      "message": "Testing webhook connection"
    }
  }'
```

### From the Application
```typescript
// Test webhook connection
const isConnected = await webhookService.testConnection();
console.log('Webhook connected:', isConnected);
```

## 5. n8n Workflow Processing

### Basic Processing Flow
1. **Webhook Node** - Receives data from Yellow Box
2. **Set Variables** - Extract event type and data
3. **Switch Node** - Route based on event type
4. **Process Data** - Transform/enrich data as needed
5. **Store/Forward** - Save to database or trigger other actions

### Example n8n Nodes Configuration

#### Switch Node (Route by Event Type)
```javascript
// In Switch node rules
$json.type === "rider.registered"
$json.type === "expense.submitted"
$json.type === "bike.assigned"
```

#### Code Node (Process Rider Registration)
```javascript
const eventData = $json.data;

return [{
  json: {
    riderId: eventData.riderId,
    name: eventData.name,
    email: eventData.email,
    status: eventData.status,
    timestamp: $json.timestamp,
    // Add enrichment
    welcomeEmailRequired: true,
    trainingScheduleNeeded: true
  }
}];
```

## 6. Monitoring & Debugging

### Check Webhook Logs in Firestore
Collection: `webhook_logs`
```typescript
// View recent webhook activity
const logs = await getDocs(
  query(
    collection(db, 'webhook_logs'),
    orderBy('timestamp', 'desc'),
    limit(10)
  )
);
```

### n8n Execution History
1. Go to your workflow in n8n
2. Click "Executions" tab
3. View successful/failed executions
4. Click on execution to see data flow

### Common Issues & Solutions

#### Webhook Not Receiving Data
- ✓ Check workflow is Active
- ✓ Verify webhook URL is correct
- ✓ Ensure VITE_WEBHOOK_ENABLED=true
- ✓ Check browser console for errors

#### Authentication Errors
- ✓ Webhook nodes don't require auth by default
- ✓ If secured, add auth headers in webhookService

#### Data Not Processing
- ✓ Check Switch node conditions
- ✓ Verify JSON structure matches
- ✓ Look for errors in n8n execution logs

## 7. Security Considerations

### Webhook Security
1. Use HTTPS (already enabled)
2. Consider adding webhook authentication:
   ```typescript
   // In webhookService.ts
   headers: {
     'Content-Type': 'application/json',
     'X-Webhook-Secret': import.meta.env.VITE_WEBHOOK_SECRET
   }
   ```

3. In n8n, validate the secret:
   ```javascript
   // In n8n Code node
   if ($headers['x-webhook-secret'] !== $env.WEBHOOK_SECRET) {
     throw new Error('Invalid webhook secret');
   }
   ```

### Rate Limiting
- Implement client-side throttling for high-frequency events
- Use n8n's built-in rate limiting if needed

## 8. Next Steps

1. **Update webhook URL** in `.env` with actual path from n8n
2. **Test the connection** using the test script
3. **Monitor initial events** in n8n executions
4. **Add webhook calls** to key application functions
5. **Set up notifications** or downstream workflows in n8n

## Example Integration Points

### Auth Context
```typescript
// In AuthContext.tsx login function
await webhookService.onUserLoggedIn(user.uid, userRole);
```

### Rider Service
```typescript
// In riderFirestoreService.ts
await webhookService.onRiderStatusChanged(riderId, oldStatus, newStatus);
```

### Expense Service
```typescript
// In expenseFirestoreService.ts
await webhookService.onExpenseApproved(expenseId, approvedBy);
```