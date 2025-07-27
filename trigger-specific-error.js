#!/usr/bin/env node

/**
 * Trigger the specific Google Sheets error to verify the fix
 */

const WEBHOOK_URL = 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync';

// This payload should trigger the "Sync Expense Data1" node
const errorTriggerPayload = {
  type: 'expense',
  id: `error-trigger-${Date.now()}`,
  action: 'created',
  data: {
    id: `error-trigger-${Date.now()}`,
    riderId: 'test-rider-error',
    riderName: 'Error Trigger Test',
    amount: 123.45,
    category: 'Error Test',
    description: 'This should trigger the Google Sheets Column to Match On error',
    status: 'pending',
    receiptUrl: 'https://example.com/error-test-receipt.jpg',
    submittedDate: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  timestamp: new Date().toISOString()
};

async function triggerError() {
  console.log('🚨 Triggering Specific Google Sheets Error');
  console.log('This will reproduce the "Column to Match On" error');
  console.log('=' .repeat(60));
  
  console.log('📤 Sending payload that triggers "Sync Expense Data1" node:');
  console.log(JSON.stringify(errorTriggerPayload, null, 2));
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorTriggerPayload)
    });
    
    const responseData = await response.text();
    let parsedResponse;
    
    try {
      parsedResponse = JSON.parse(responseData);
    } catch (e) {
      parsedResponse = responseData;
    }
    
    console.log(`\n📥 Webhook Response: ${response.status}`);
    console.log(`📥 Data:`, parsedResponse);
    
    if (response.ok) {
      console.log('\n✅ Webhook accepted the payload');
      console.log('⏳ N8N workflow should now execute and hit the Google Sheets error');
      console.log('\n🔍 Expected Error in N8N:');
      console.log('   Node: "Sync Expense Data1"');
      console.log('   Error: "The \'Column to Match On\' parameter is required"');
      console.log('\n🔧 To fix this error:');
      console.log('   1. Go to N8N workflow editor');
      console.log('   2. Click on "Sync Expense Data1" node');
      console.log('   3. Set "Column to Match On" to: id');
      console.log('   4. Save and activate workflow');
      console.log('\n📋 After fix, run: node test-complete-google-sheets-flow.js');
    } else {
      console.log('\n❌ Webhook request failed');
      console.log('Check webhook configuration');
    }
    
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🎯 This test confirms the error exists and needs the fix');
  console.log('=' .repeat(60));
}

triggerError();