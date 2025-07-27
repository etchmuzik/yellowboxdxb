#!/usr/bin/env node

/**
 * Test script for N8N webhook connectivity
 * Run this to verify the webhook is working properly
 */

// Using native fetch (Node.js 18+)

// N8N Real-time Data Sync Workflow (ID: e91V8Vqp3fxl80PS)
const WEBHOOK_URL = 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync';

const testPayloads = [
  {
    name: 'Basic Connectivity Test',
    payload: {
      type: 'test',
      id: 'connectivity-test',
      action: 'ping',
      data: { message: 'Testing webhook connectivity' },
      timestamp: new Date().toISOString()
    }
  },
  {
    name: 'Rider Creation Test',
    payload: {
      type: 'rider',
      id: 'test-rider-123',
      action: 'created',
      data: {
        id: 'test-rider-123',
        name: 'Test Rider',
        email: 'test@example.com',
        phone: '+971501234567',
        status: 'Applied',
        createdAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    }
  },
  {
    name: 'Expense Creation Test',
    payload: {
      type: 'expense',
      id: 'test-expense-456',
      action: 'created',
      data: {
        id: 'test-expense-456',
        riderId: 'test-rider-123',
        amount: 100,
        category: 'Fuel',
        description: 'Test fuel expense',
        status: 'pending',
        createdAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    }
  },
  {
    name: 'Document Upload Test',
    payload: {
      type: 'document',
      id: 'test-document-789',
      action: 'created',
      data: {
        id: 'test-document-789',
        riderId: 'test-rider-123',
        type: 'Visa',
        status: 'Pending',
        fileName: 'test-visa.pdf',
        uploadDate: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    }
  }
];

async function testWebhook(testCase) {
  try {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📤 Payload:`, JSON.stringify(testCase.payload, null, 2));
    
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCase.payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    
    let responseData = null;
    try {
      responseData = await response.text();
      if (responseData) {
        responseData = JSON.parse(responseData);
      }
    } catch (e) {
      // Response might not be JSON
    }
    
    if (response.ok) {
      console.log(`✅ Success! Status: ${response.status}, Duration: ${duration}ms`);
      if (responseData) {
        console.log(`📥 Response:`, responseData);
      }
      return { success: true, duration, status: response.status };
    } else {
      console.log(`❌ Failed: HTTP ${response.status} ${response.statusText}`);
      if (responseData) {
        console.log(`   Data:`, responseData);
      }
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 Starting N8N Webhook Connectivity Tests');
  console.log(`🎯 Target URL: ${WEBHOOK_URL}`);
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const testCase of testPayloads) {
    const result = await testWebhook(testCase);
    results.push({ name: testCase.name, ...result });
    
    // Wait 1 second between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Test Results Summary:');
  console.log('=' .repeat(60));
  
  let successCount = 0;
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${result.name}`);
    if (result.success) {
      successCount++;
      console.log(`   Duration: ${result.duration}ms, Status: ${result.status}`);
    } else {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('\n' + '=' .repeat(60));
  console.log(`🎯 Overall Result: ${successCount}/${results.length} tests passed`);
  
  if (successCount === results.length) {
    console.log('🎉 All tests passed! Webhook is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check N8N configuration and connectivity.');
  }
  
  console.log('=' .repeat(60));
}

// Check if N8N is running
async function checkN8NStatus() {
  try {
    console.log('🔍 Checking if N8N is running...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('http://localhost:5678/healthz', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ N8N is running and accessible');
      return true;
    } else {
      console.log('❌ N8N returned status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ N8N is not accessible. Make sure N8N is running on localhost:5678');
    console.log('   Start N8N with: npx n8n start');
    return false;
  }
}

// Main execution
async function main() {
  const isN8NRunning = await checkN8NStatus();
  
  if (!isN8NRunning) {
    console.log('\n💡 To start N8N:');
    console.log('   1. Install N8N: npm install -g n8n');
    console.log('   2. Start N8N: npx n8n start');
    console.log('   3. Import the Real-time Data Sync workflow (ID: e91V8Vqp3fxl80PS)');
    console.log('   4. Activate the workflow in N8N');
    console.log('   5. Check that the webhook URL is: /webhook/yellowbox-sync');
    console.log('   6. Run this test again: npm run test-webhook');
    process.exit(1);
  }
  
  await runAllTests();
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Test execution failed:', error.message);
    process.exit(1);
  });
}

export { testWebhook, runAllTests };