/**
 * Webhook Service for N8N Integration
 * Handles real-time data synchronization with N8N workflows
 */

// N8N Cloud Real-time Data Sync Workflow
const WEBHOOK_URL = 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync';

export interface WebhookPayload {
  type: 'rider' | 'expense' | 'document';
  id: string;
  action: 'created' | 'updated' | 'deleted';
  data: any;
  timestamp: string;
}

/**
 * Trigger sync webhook to N8N
 */
export const triggerSync = async (
  type: WebhookPayload['type'],
  id: string,
  action: WebhookPayload['action'],
  data: any
): Promise<void> => {
  try {
    const payload: WebhookPayload = {
      type,
      id,
      action,
      data,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status}`);
    }

    console.log(`✅ Webhook sent successfully for ${type}/${id} (${action})`);
  } catch (error) {
    console.error('❌ Sync webhook failed:', error);
    // Don't throw error to prevent disrupting main operations
  }
};

/**
 * Batch sync multiple records
 */
export const triggerBatchSync = async (
  items: Array<{
    type: WebhookPayload['type'];
    id: string;
    action: WebhookPayload['action'];
    data: any;
  }>
): Promise<void> => {
  try {
    const batchPayload = {
      batch: true,
      items: items.map(item => ({
        ...item,
        timestamp: new Date().toISOString()
      })),
      timestamp: new Date().toISOString()
    };

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchPayload)
    });

    if (!response.ok) {
      throw new Error(`Batch webhook failed with status: ${response.status}`);
    }

    console.log(`✅ Batch webhook sent successfully for ${items.length} items`);
  } catch (error) {
    console.error('❌ Batch sync webhook failed:', error);
  }
};

/**
 * Test webhook connectivity
 */
export const testWebhook = async (): Promise<boolean> => {
  try {
    const testPayload = {
      type: 'test',
      id: 'test-connection',
      action: 'ping',
      data: { message: 'Testing webhook connectivity' },
      timestamp: new Date().toISOString()
    };

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    return response.ok;
  } catch (error) {
    console.error('❌ Webhook test failed:', error);
    return false;
  }
};