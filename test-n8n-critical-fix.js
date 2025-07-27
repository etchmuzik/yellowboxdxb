/**
 * Critical N8N Fix Verification Script
 * Tests the N8N workflow after implementing the critical fix
 */

const https = require('https');

// Test configurations
const N8N_WEBHOOK_URL = 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync';
const TEST_TIMEOUT = 10000; // 10 seconds

// Test payloads
const testPayloads = {
  rider: {
    operation: 'rider_create',
    data: {
      id: `test-rider-${Date.now()}`,
      name: 'Test Rider Fix',
      email: 'test@yellowbox.ae',
      phone: '+971501234567',
      status: 'Applied',
      timestamp: new Date().toISOString(),
      visaNumber: 'VISA123456',
      licenseNumber: 'LIC789012',
      expectedStartDate: '2025-08-01',
      nationality: 'UAE',
      dateOfBirth: '1990-01-01',
      address: 'Dubai, UAE',
      emergencyContact: '+971509876543'
    },
    timestamp: new Date().toISOString()
  },
  expense: {
    operation: 'expense_create',
    data: {
      id: `test-expense-${Date.now()}`,
      riderId: 'test-rider-001',
      riderName: 'Test Rider',
      amount: 150.00,
      category: 'Fuel',
      description: 'Weekly fuel expense',
      status: 'Pending',
      receiptUrl: 'https://example.com/receipt.jpg',
      submittedDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  }
};

/**
 * Send HTTP POST request to N8N webhook
 */
function sendWebhookRequest(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    
    const options = {
      hostname: 'n8n.srv924607.hstgr.cloud',
      port: 443,
      path: '/webhook/yellowbox-sync',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      },
      timeout: TEST_TIMEOUT
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedResponse = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsedResponse
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(data);
    req.end();
  });
}

/**
 * Test N8N server accessibility
 */
async function testServerHealth() {
  console.log('🔍 Testing N8N server health...');
  
  try {
    const response = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'n8n.srv924607.hstgr.cloud',
        port: 443,
        path: '/',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        resolve({ statusCode: res.statusCode });
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
      req.end();
    });

    if (response.statusCode === 200) {
      console.log('✅ N8N server is accessible');
      return true;
    } else {
      console.log(`⚠️ N8N server returned status: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ N8N server health check failed: ${error.message}`);
    return false;
  }
}

/**
 * Run comprehensive fix verification
 */
async function runFixVerification() {
  console.log('🚨 CRITICAL N8N FIX VERIFICATION');
  console.log('=====================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Target: ${N8N_WEBHOOK_URL}`);
  console.log('');

  // Test 1: Server Health
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    console.log('🚨 CRITICAL: N8N server is not accessible');
    return;
  }
  console.log('');

  // Test 2: Webhook Endpoint
  console.log('🧪 Testing webhook endpoint...');
  
  const tests = [
    { name: 'Rider Data Test', payload: testPayloads.rider },
    { name: 'Expense Data Test', payload: testPayloads.expense }
  ];

  let passedTests = 0;
  const totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`\n📤 Running: ${test.name}`);
      console.log(`Payload: ${test.payload.operation}`);
      
      const response = await sendWebhookRequest(test.payload);
      
      if (response.statusCode === 200) {
        console.log(`✅ ${test.name}: SUCCESS`);
        console.log(`   Status: ${response.statusCode}`);
        console.log(`   Response: ${JSON.stringify(response.body).substring(0, 100)}...`);
        passedTests++;
      } else if (response.statusCode === 500) {
        console.log(`❌ ${test.name}: CRITICAL ERROR (500)`);
        console.log(`   Response: ${JSON.stringify(response.body)}`);
        console.log(`   🚨 This indicates the workflow configuration is still broken!`);
      } else {
        console.log(`⚠️ ${test.name}: Unexpected status ${response.statusCode}`);
        console.log(`   Response: ${JSON.stringify(response.body)}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR`);
      console.log(`   Error: ${error.message}`);
    }
  }

  // Results Summary
  console.log('\n📊 FIX VERIFICATION RESULTS');
  console.log('============================');
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  console.log(`Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 SUCCESS: N8N workflow fix is WORKING!');
    console.log('');
    console.log('✅ Next Steps:');
    console.log('   1. Test with real Yellow Box app data');
    console.log('   2. Check Google Sheets for synced data');
    console.log('   3. Deploy Firebase Cloud Functions');
    console.log('   4. Proceed with MCP server setup');
  } else if (passedTests === 0) {
    console.log('🚨 CRITICAL: N8N workflow fix FAILED completely!');
    console.log('');
    console.log('❌ Action Required:');
    console.log('   1. Follow N8N_CRITICAL_FIX_GUIDE.md step-by-step');
    console.log('   2. Ensure workflow is imported and activated');
    console.log('   3. Verify Google Sheets credentials are configured');
    console.log('   4. Check "Column to Match On" is set to "id"');
  } else {
    console.log('⚠️ PARTIAL: Some tests passed, system needs attention');
    console.log('');
    console.log('🔧 Review:');
    console.log('   1. Check which data types are failing');
    console.log('   2. Verify Google Sheets node configurations');
    console.log('   3. Test individual workflow nodes');
  }

  console.log('\n📁 Reference Files:');
  console.log('   - N8N_CRITICAL_FIX_GUIDE.md (step-by-step fix)');
  console.log('   - COMPLETE_N8N_WORKFLOW.json (ready-to-import workflow)');
  console.log('   - GOOGLE_SHEETS_INTEGRATION_SOLUTION.md (sheets setup)');
  console.log('');
  console.log(`🔄 Re-run this test: node ${__filename.split('/').pop()}`);
}

// Run the verification
if (require.main === module) {
  runFixVerification().catch(console.error);
}

module.exports = { runFixVerification, sendWebhookRequest, testServerHealth };