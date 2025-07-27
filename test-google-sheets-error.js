#!/usr/bin/env node

/**
 * Test to reproduce and diagnose the Google Sheets "Column to Match On" error
 */

const WEBHOOK_URL = 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync';

// Test payload that should trigger the Google Sheets processing
const testPayload = {
  type: 'expense',
  id: `error-test-${Date.now()}`,
  action: 'created',
  data: {
    id: `error-test-${Date.now()}`,
    riderId: 'test-rider-123',
    riderName: 'Error Test Rider',
    amount: 99.99,
    category: 'Test Category',
    description: 'Test expense to trigger Google Sheets error',
    status: 'pending',
    receiptUrl: 'https://example.com/test-receipt.jpg',
    submittedDate: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  timestamp: new Date().toISOString()
};

async function sendTestPayload() {
  try {
    console.log('🧪 Testing Google Sheets Integration Error');
    console.log('=' .repeat(60));
    console.log('📤 Sending test payload to trigger Google Sheets processing...');
    console.log(JSON.stringify(testPayload, null, 2));
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    const responseData = await response.text();
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(responseData);
    } catch (e) {
      parsedResponse = responseData;
    }
    
    console.log(`\n📥 Response Status: ${response.status}`);
    console.log(`📥 Response Data:`, parsedResponse);
    
    if (response.ok) {
      console.log('\n✅ Webhook accepted the payload');
      console.log('⏳ The Google Sheets error should appear in N8N execution logs');
      console.log('\n🔍 To check for the error:');
      console.log('1. Go to N8N workflow editor');
      console.log('2. Check the execution history');
      console.log('3. Look for failed executions with "Column to Match On" error');
    } else {
      console.log('\n❌ Webhook request failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

console.log('🚨 REPRODUCING GOOGLE SHEETS ERROR');
console.log('This test sends data that should trigger the Google Sheets node');
console.log('and reproduce the "Column to Match On" parameter error.');
console.log('');

sendTestPayload();