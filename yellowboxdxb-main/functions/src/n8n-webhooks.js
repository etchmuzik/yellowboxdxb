const functions = require('firebase-functions');
const axios = require('axios');

// n8n webhook configuration
const N8N_WEBHOOK_URL = functions.config().n8n?.webhook_url || 'https://your-n8n-instance.com/webhook/yellowbox-sync';
const WEBHOOK_SECRET = functions.config().n8n?.webhook_secret || '';

/**
 * Generic webhook trigger for n8n automation
 * Sends data changes to n8n for processing and Google Sheets sync
 */
const triggerN8nWebhook = async (payload) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add secret header if configured
    if (WEBHOOK_SECRET) {
      headers['X-Webhook-Secret'] = WEBHOOK_SECRET;
    }
    
    const response = await axios.post(N8N_WEBHOOK_URL, payload, {
      headers,
      timeout: 10000, // 10 second timeout
    });
    
    console.log('n8n webhook triggered successfully:', {
      type: payload.type,
      id: payload.id,
      action: payload.action,
      status: response.status
    });
    
    return { success: true, status: response.status };
  } catch (error) {
    console.error('n8n webhook failed:', {
      error: error.message,
      payload: payload,
      url: N8N_WEBHOOK_URL
    });
    
    return { success: false, error: error.message };
  }
};

/**
 * Rider data sync webhook
 * Triggers when rider documents are created, updated, or deleted
 */
exports.syncRiderData = functions.firestore
  .document('riders/{riderId}')
  .onWrite(async (change, context) => {
    const { riderId } = context.params;
    
    // Determine action type
    let action = 'updated';
    if (!change.before.exists) action = 'created';
    if (!change.after.exists) action = 'deleted';
    
    // Get rider data
    const riderData = change.after.exists ? change.after.data() : null;
    
    // Prepare webhook payload
    const payload = {
      type: 'rider',
      id: riderId,
      action: action,
      data: riderData,
      timestamp: new Date().toISOString(),
      collection: 'riders'
    };
    
    // Add additional metadata for better tracking
    if (riderData) {
      payload.metadata = {
        name: riderData.name || 'Unknown',
        status: riderData.status || 'Unknown',
        email: riderData.email || 'No email'
      };
    }
    
    return await triggerN8nWebhook(payload);
  });

/**
 * Expense data sync webhook
 * Triggers when expense documents are created, updated, or deleted
 */
exports.syncExpenseData = functions.firestore
  .document('expenses/{expenseId}')
  .onWrite(async (change, context) => {
    const { expenseId } = context.params;
    
    // Determine action type
    let action = 'updated';
    if (!change.before.exists) action = 'created';
    if (!change.after.exists) action = 'deleted';
    
    // Get expense data
    const expenseData = change.after.exists ? change.after.data() : null;
    
    // Prepare webhook payload
    const payload = {
      type: 'expense',
      id: expenseId,
      action: action,
      data: expenseData,
      timestamp: new Date().toISOString(),
      collection: 'expenses'
    };
    
    // Add additional metadata for better tracking
    if (expenseData) {
      payload.metadata = {
        riderId: expenseData.riderId || 'Unknown',
        amount: expenseData.amount || 0,
        category: expenseData.category || 'Unknown',
        status: expenseData.status || 'Unknown'
      };
    }
    
    return await triggerN8nWebhook(payload);
  });

/**
 * Document data sync webhook
 * Triggers when document records are created, updated, or deleted
 */
exports.syncDocumentData = functions.firestore
  .document('documents/{documentId}')
  .onWrite(async (change, context) => {
    const { documentId } = context.params;
    
    // Determine action type
    let action = 'updated';
    if (!change.before.exists) action = 'created';
    if (!change.after.exists) action = 'deleted';
    
    // Get document data
    const documentData = change.after.exists ? change.after.data() : null;
    
    // Prepare webhook payload
    const payload = {
      type: 'document',
      id: documentId,
      action: action,
      data: documentData,
      timestamp: new Date().toISOString(),
      collection: 'documents'
    };
    
    // Add additional metadata for better tracking
    if (documentData) {
      payload.metadata = {
        riderId: documentData.riderId || 'Unknown',
        type: documentData.type || 'Unknown',
        status: documentData.status || 'Unknown',
        expiryDate: documentData.expiryDate || null
      };
    }
    
    return await triggerN8nWebhook(payload);
  });

/**
 * User activity sync webhook
 * Triggers when user documents are created, updated, or deleted
 */
exports.syncUserData = functions.firestore
  .document('users/{userId}')
  .onWrite(async (change, context) => {
    const { userId } = context.params;
    
    // Determine action type
    let action = 'updated';
    if (!change.before.exists) action = 'created';
    if (!change.after.exists) action = 'deleted';
    
    // Get user data (excluding sensitive information)
    const userData = change.after.exists ? change.after.data() : null;
    let sanitizedData = null;
    
    if (userData) {
      // Remove sensitive fields before sending to webhook
      sanitizedData = {
        role: userData.role,
        email: userData.email,
        name: userData.name,
        status: userData.status,
        lastLogin: userData.lastLogin,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      };
    }
    
    // Prepare webhook payload
    const payload = {
      type: 'user',
      id: userId,
      action: action,
      data: sanitizedData,
      timestamp: new Date().toISOString(),
      collection: 'users'
    };
    
    // Add additional metadata for better tracking
    if (sanitizedData) {
      payload.metadata = {
        role: sanitizedData.role || 'Unknown',
        email: sanitizedData.email || 'No email',
        status: sanitizedData.status || 'Unknown'
      };
    }
    
    return await triggerN8nWebhook(payload);
  });

/**
 * Manual sync trigger
 * HTTP function to manually trigger data sync for specific collections
 */
exports.manualSync = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  try {
    const { collection, action = 'manual_sync' } = req.body;
    
    if (!collection) {
      res.status(400).json({ error: 'Collection parameter is required' });
      return;
    }
    
    // Prepare manual sync payload
    const payload = {
      type: 'manual_sync',
      collection: collection,
      action: action,
      timestamp: new Date().toISOString(),
      triggered_by: 'manual_request'
    };
    
    const result = await triggerN8nWebhook(payload);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: `Manual sync triggered for ${collection}`,
        timestamp: payload.timestamp
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: 'Failed to trigger manual sync'
      });
    }
  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Internal server error'
    });
  }
});

/**
 * Health check endpoint for n8n monitoring
 * Returns application health status for n8n health monitoring workflow
 */
exports.healthCheck = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }
  
  try {
    const admin = require('firebase-admin');
    
    // Check Firebase connection
    const startTime = Date.now();
    await admin.firestore().collection('health_check').limit(1).get();
    const responseTime = Date.now() - startTime;
    
    // Prepare health status
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: responseTime,
      services: {
        firestore: 'healthy',
        functions: 'healthy'
      },
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production'
    };
    
    res.status(200).json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    
    const healthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        firestore: 'unhealthy',
        functions: 'healthy'
      },
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'production'
    };
    
    res.status(503).json(healthStatus);
  }
});

/**
 * Batch sync function
 * Processes multiple records in a single webhook call to reduce API calls
 */
exports.batchSync = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    try {
      const admin = require('firebase-admin');
      const db = admin.firestore();
      
      // Get recent changes (last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const collections = ['riders', 'expenses', 'documents'];
      const batchUpdates = [];
      
      for (const collectionName of collections) {
        const snapshot = await db.collection(collectionName)
          .where('updatedAt', '>=', fiveMinutesAgo)
          .limit(50) // Limit to prevent large payloads
          .get();
        
        snapshot.forEach(doc => {
          batchUpdates.push({
            type: collectionName.slice(0, -1), // Remove 's'
            id: doc.id,
            action: 'batch_update',
            data: doc.data(),
            collection: collectionName
          });
        });
      }
      
      if (batchUpdates.length > 0) {
        const payload = {
          type: 'batch_sync',
          action: 'batch_update',
          timestamp: new Date().toISOString(),
          updates: batchUpdates,
          count: batchUpdates.length
        };
        
        await triggerN8nWebhook(payload);
        console.log(`Batch sync completed: ${batchUpdates.length} updates`);
      } else {
        console.log('No recent updates found for batch sync');
      }
    } catch (error) {
      console.error('Batch sync failed:', error);
    }
  });