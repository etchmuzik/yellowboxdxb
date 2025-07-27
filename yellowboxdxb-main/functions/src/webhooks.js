/**
 * Firebase Functions for N8N Webhook Integration
 * Automatically triggers webhooks when Firestore data changes
 */

const functions = require('firebase-functions');
const axios = require('axios');

// N8N Cloud webhook URL
const N8N_WEBHOOK_URL = 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync';

/**
 * Generic webhook trigger function
 */
const triggerWebhook = async (payload) => {
  try {
    const response = await axios.post(N8N_WEBHOOK_URL, payload, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`✅ Webhook sent successfully:`, payload.type, payload.id, payload.action);
    return response.data;
  } catch (error) {
    console.error('❌ Webhook failed:', error.message);
    // Don't throw error to prevent function failure
  }
};

/**
 * Rider collection webhook
 */
exports.syncRidersToSheets = functions.firestore
  .document('riders/{riderId}')
  .onWrite(async (change, context) => {
    const { riderId } = context.params;
    
    // Determine action type
    let action = 'updated';
    if (!change.before.exists) action = 'created';
    if (!change.after.exists) action = 'deleted';
    
    // Prepare webhook payload
    const payload = {
      type: 'rider',
      id: riderId,
      action: action,
      data: change.after.exists ? { id: riderId, ...change.after.data() } : null,
      timestamp: new Date().toISOString(),
      source: 'firebase-function'
    };
    
    return await triggerWebhook(payload);
  });

/**
 * Expenses collection webhook
 */
exports.syncExpensesToSheets = functions.firestore
  .document('expenses/{expenseId}')
  .onWrite(async (change, context) => {
    const { expenseId } = context.params;
    
    // Determine action type
    let action = 'updated';
    if (!change.before.exists) action = 'created';
    if (!change.after.exists) action = 'deleted';
    
    // Prepare webhook payload
    const payload = {
      type: 'expense',
      id: expenseId,
      action: action,
      data: change.after.exists ? { id: expenseId, ...change.after.data() } : null,
      timestamp: new Date().toISOString(),
      source: 'firebase-function'
    };
    
    return await triggerWebhook(payload);
  });

/**
 * Documents collection webhook
 */
exports.syncDocumentsToSheets = functions.firestore
  .document('rider_documents/{documentId}')
  .onWrite(async (change, context) => {
    const { documentId } = context.params;
    
    // Determine action type
    let action = 'updated';
    if (!change.before.exists) action = 'created';
    if (!change.after.exists) action = 'deleted';
    
    // Prepare webhook payload
    const payload = {
      type: 'document',
      id: documentId,
      action: action,
      data: change.after.exists ? { id: documentId, ...change.after.data() } : null,
      timestamp: new Date().toISOString(),
      source: 'firebase-function'
    };
    
    return await triggerWebhook(payload);
  });

/**
 * Health check endpoint for webhook connectivity
 */
exports.webhookHealthCheck = functions.https.onRequest(async (req, res) => {
  try {
    const testPayload = {
      type: 'health-check',
      id: 'test-connection',
      action: 'ping',
      data: { 
        message: 'Health check from Firebase Functions',
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      source: 'firebase-function-health-check'
    };
    
    const result = await triggerWebhook(testPayload);
    
    res.status(200).json({
      success: true,
      message: 'Webhook connectivity test completed',
      webhookUrl: N8N_WEBHOOK_URL,
      result: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Webhook connectivity test failed',
      error: error.message
    });
  }
});

/**
 * Manual sync trigger endpoint
 */
exports.manualSync = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    const { type, id, action, data } = req.body;
    
    if (!type || !id || !action) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: type, id, action'
      });
      return;
    }
    
    const payload = {
      type,
      id,
      action,
      data,
      timestamp: new Date().toISOString(),
      source: 'manual-sync'
    };
    
    const result = await triggerWebhook(payload);
    
    res.status(200).json({
      success: true,
      message: 'Manual sync triggered successfully',
      payload: payload,
      result: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Manual sync failed',
      error: error.message
    });
  }
});