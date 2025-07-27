// Webhook Test Script for n8n
// This script tests the webhook and shows how to integrate it with your web app

const axios = require('axios');

// Configuration
const config = {
  // Replace with your actual webhook URL from n8n
  webhookUrl: 'https://n8n.srv924607.hstgr.cloud/webhook/YOUR_WEBHOOK_PATH',
  
  // Test data to send
  testData: {
    timestamp: new Date().toISOString(),
    source: 'yellow-box-app',
    type: 'test',
    data: {
      userId: 'test-user-123',
      action: 'webhook-test',
      metadata: {
        app: 'Yellow Box',
        environment: 'development'
      }
    }
  }
};

// Function to test webhook
async function testWebhook() {
  console.log('🔄 Testing webhook...');
  console.log('URL:', config.webhookUrl);
  console.log('Data:', JSON.stringify(config.testData, null, 2));
  
  try {
    const response = await axios.post(config.webhookUrl, config.testData, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Yellow-Box-Webhook-Test'
      }
    });
    
    console.log('✅ Webhook test successful!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Webhook test failed!');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    
    return {
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }
}

// Function to send Yellow Box data to webhook
async function sendYellowBoxData(eventType, eventData) {
  const payload = {
    timestamp: new Date().toISOString(),
    source: 'yellow-box',
    type: eventType,
    data: eventData
  };
  
  try {
    const response = await axios.post(config.webhookUrl, payload);
    return { success: true, response: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Example: Send rider registration event
async function sendRiderRegistration(riderData) {
  return sendYellowBoxData('rider.registration', {
    riderId: riderData.id,
    name: riderData.name,
    email: riderData.email,
    phone: riderData.phone,
    status: 'applied',
    registeredAt: new Date().toISOString()
  });
}

// Example: Send expense submission event
async function sendExpenseSubmission(expenseData) {
  return sendYellowBoxData('expense.submitted', {
    expenseId: expenseData.id,
    riderId: expenseData.riderId,
    amount: expenseData.amount,
    type: expenseData.type,
    submittedAt: new Date().toISOString()
  });
}

// Example: Send bike assignment event
async function sendBikeAssignment(assignmentData) {
  return sendYellowBoxData('bike.assigned', {
    bikeId: assignmentData.bikeId,
    riderId: assignmentData.riderId,
    assignedAt: new Date().toISOString()
  });
}

// Run test if called directly
if (require.main === module) {
  console.log('Running webhook test...\n');
  testWebhook().then(result => {
    console.log('\nTest complete:', result);
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = {
  testWebhook,
  sendYellowBoxData,
  sendRiderRegistration,
  sendExpenseSubmission,
  sendBikeAssignment
};