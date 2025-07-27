#!/usr/bin/env node

/**
 * Test both production and test webhook endpoints
 */

const PRODUCTION_URL = 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync';
const TEST_URL = 'https://n8n.srv924607.hstgr.cloud/webhook-test/yellowbox-sync';

const testPayload = {
  type: 'rider',
  id: `test-${Date.now()}`,
  action: 'created',
  data: {
    id: `test-${Date.now()}`,
    name: 'Test Rider',
    email: 'test@yellowbox.ae',
    phone: '+971501234567',
    status: 'Applied',
    visaNumber: 'VN123456789',
    licenseNumber: 'DL987654321',
    expectedStartDate: '2025-08-01',
    createdAt: new Date().toISOString(),
    nationality: 'UAE',
    dateOfBirth: '1990-01-01',
    address: 'Dubai, UAE',
    emergencyContact: '+971509876543'
  },
  timestamp: new Date().toISOString()
};

async function testEndpoint(url, name) {
  console.log(`\n🧪 Testing ${name}`);
  console.log(`🎯 URL: ${url}`);
  console.log('=' .repeat(60));
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    const responseText = await response.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = responseText;
    }
    
    console.log(`📥 Status: ${response.status}`);
    console.log(`📥 Response:`, responseData);
    
    if (response.ok) {
      console.log(`✅ ${name} is working!`);
      return { success: true, status: response.status, data: responseData };
    } else {
      console.log(`❌ ${name} failed`);
      
      // Analyze the error
      if (responseData.message && responseData.message.includes('not registered')) {
        console.log('💡 Issue: Webhook not registered (workflow may be inactive)');
      } else if (responseData.message && responseData.message.includes('Execute workflow')) {
        console.log('💡 Issue: Test webhook requires manual execution from n8n canvas');
      } else if (responseData.message && responseData.message.includes('could not be started')) {
        console.log('💡 Issue: Workflow execution error (check workflow configuration)');
      }
      
      return { success: false, status: response.status, data: responseData };
    }
    
  } catch (error) {
    console.log(`❌ ${name} connection failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 N8N Webhook Endpoint Testing');
  console.log('Testing both production and test endpoints');
  console.log('=' .repeat(80));
  
  // Test production endpoint
  const prodResult = await testEndpoint(PRODUCTION_URL, 'Production Webhook');
  
  // Test test endpoint
  const testResult = await testEndpoint(TEST_URL, 'Test Webhook');
  
  // Summary
  console.log('\n' + '=' .repeat(80));
  console.log('📊 SUMMARY');
  console.log('=' .repeat(80));
  
  console.log(`🏭 Production Webhook: ${prodResult.success ? '✅ WORKING' : '❌ FAILED'}`);
  if (prodResult.success) {
    console.log(`   Status: ${prodResult.status}`);
    console.log(`   Response: ${JSON.stringify(prodResult.data)}`);
  } else if (prodResult.data) {
    console.log(`   Error: ${prodResult.data.message || prodResult.error}`);
  }
  
  console.log(`🧪 Test Webhook: ${testResult.success ? '✅ WORKING' : '❌ FAILED'}`);
  if (testResult.success) {
    console.log(`   Status: ${testResult.status}`);
    console.log(`   Response: ${JSON.stringify(testResult.data)}`);
  } else if (testResult.data) {
    console.log(`   Error: ${testResult.data.message || testResult.error}`);
  }
  
  console.log('\n🔧 RECOMMENDATIONS:');
  
  if (!prodResult.success && !testResult.success) {
    console.log('❌ Both endpoints are failing');
    console.log('1. Check if n8n workflow is active');
    console.log('2. Verify webhook configuration in n8n');
    console.log('3. Check n8n instance status');
  } else if (!prodResult.success && testResult.success) {
    console.log('⚠️  Production endpoint inactive, test endpoint working');
    console.log('1. Activate the workflow in n8n editor');
    console.log('2. Use the toggle in top-right of workflow editor');
  } else if (prodResult.success && !testResult.success) {
    console.log('✅ Production endpoint working, test endpoint requires manual trigger');
    console.log('1. This is normal - test endpoints need manual execution');
    console.log('2. Use production endpoint for automated testing');
  } else {
    console.log('✅ Both endpoints are working correctly!');
  }
  
  console.log('\n📋 NEXT STEPS:');
  if (prodResult.success) {
    console.log('✅ Production webhook is working - you can use the Yellow Box app');
    console.log('✅ Run: node test-complete-google-sheets-flow.js (update URL if needed)');
  } else {
    console.log('❌ Activate the workflow in n8n to enable production webhook');
    console.log('❌ Go to: https://n8n.srv924607.hstgr.cloud/workflow/sm5RUQQwjr2cR4mB');
  }
  
  console.log('=' .repeat(80));
}

runTests();