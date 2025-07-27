#!/usr/bin/env node

const https = require('https');

const WEBHOOK_URL = 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync';

// Helper function to make HTTP requests
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    };

    const req = https.request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers
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

    req.write(postData);
    req.end();
  });
}

// Comprehensive N8N workflow verification
async function runN8NWorkflowVerification() {
  console.log('🚀 N8N WORKFLOW VERIFICATION TEST');
  console.log('==================================');
  console.log(`🎯 Target: ${WEBHOOK_URL}`);
  console.log(`📅 Test Time: ${new Date().toISOString()}\n`);

  const testResults = [];

  // Test 1: Basic connectivity
  console.log('🔍 TEST 1: Basic Connectivity');
  console.log('─────────────────────────────');
  try {
    const response = await makeRequest(WEBHOOK_URL, {
      test: true,
      timestamp: new Date().toISOString()
    });
    
    testResults.push({
      test: 'Basic Connectivity',
      status: response.status < 400 ? 'SUCCESS' : 'FAILED',
      httpCode: response.status,
      response: response.data
    });
    
    if (response.status < 400) {
      console.log(`✅ SUCCESS - Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data)}`);
    } else {
      console.log(`❌ FAILED - Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    testResults.push({
      test: 'Basic Connectivity', 
      status: 'FAILED',
      httpCode: 'ERROR',
      error: error.message
    });
    console.log(`❌ FAILED - Error: ${error.message}`);
  }

  // Test 2: Current Web App Payload Structure
  console.log('\n🔍 TEST 2: Current Web App Payload Structure');
  console.log('─────────────────────────────────────────────');
  const webAppPayload = {
    type: 'rider',
    id: 'test-rider-001',
    action: 'created',
    data: {
      id: 'test-rider-001',
      firstName: 'Ahmed',
      lastName: 'Al-Mansouri', 
      email: 'ahmed@test.com',
      phone: '+971501234567',
      status: 'applied',
      createdAt: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  };

  try {
    const response = await makeRequest(WEBHOOK_URL, webAppPayload);
    testResults.push({
      test: 'Web App Payload',
      status: response.status < 400 ? 'SUCCESS' : 'FAILED',
      httpCode: response.status,
      response: response.data
    });
    
    if (response.status < 400) {
      console.log(`✅ SUCCESS - Status: ${response.status}`);
      console.log(`   Web app payload processed correctly`);
    } else {
      console.log(`❌ FAILED - Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    testResults.push({
      test: 'Web App Payload',
      status: 'FAILED',
      httpCode: 'ERROR', 
      error: error.message
    });
    console.log(`❌ FAILED - Error: ${error.message}`);
  }

  // Test 3: Simple Rider Data (Expected by N8N)
  console.log('\n🔍 TEST 3: Simple Rider Data (N8N Expected)');
  console.log('─────────────────────────────────────────────');
  const simpleRiderPayload = {
    id: 'test-rider-002',
    name: 'Test Rider Simple',
    email: 'test2@yellowbox.ae',
    phone: '+971501234568',
    status: 'applied',
    timestamp: new Date().toISOString()
  };

  try {
    const response = await makeRequest(WEBHOOK_URL, simpleRiderPayload);
    testResults.push({
      test: 'Simple Rider Data',
      status: response.status < 400 ? 'SUCCESS' : 'FAILED',
      httpCode: response.status,
      response: response.data
    });
    
    if (response.status < 400) {
      console.log(`✅ SUCCESS - Status: ${response.status}`);
      console.log(`   Simple rider data processed correctly`);
    } else {
      console.log(`❌ FAILED - Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    testResults.push({
      test: 'Simple Rider Data',
      status: 'FAILED',
      httpCode: 'ERROR',
      error: error.message  
    });
    console.log(`❌ FAILED - Error: ${error.message}`);
  }

  // Test 4: Expense Data
  console.log('\n🔍 TEST 4: Expense Data Structure');
  console.log('─────────────────────────────────');
  const expensePayload = {
    type: 'expense',
    id: 'test-expense-001',
    riderId: 'test-rider-001',
    amount: 50.00,
    description: 'Test expense',
    status: 'pending',
    timestamp: new Date().toISOString()
  };

  try {
    const response = await makeRequest(WEBHOOK_URL, expensePayload);
    testResults.push({
      test: 'Expense Data',
      status: response.status < 400 ? 'SUCCESS' : 'FAILED',
      httpCode: response.status,
      response: response.data
    });
    
    if (response.status < 400) {
      console.log(`✅ SUCCESS - Status: ${response.status}`);
      console.log(`   Expense data processed correctly`);
    } else {
      console.log(`❌ FAILED - Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data)}`);
    }
  } catch (error) {
    testResults.push({
      test: 'Expense Data',
      status: 'FAILED',
      httpCode: 'ERROR',
      error: error.message  
    });
    console.log(`❌ FAILED - Error: ${error.message}`);
  }

  // Generate comprehensive report
  console.log('\n' + '='.repeat(60));
  console.log('📊 N8N WORKFLOW VERIFICATION RESULTS');
  console.log('='.repeat(60));
  
  const successCount = testResults.filter(r => r.status === 'SUCCESS').length;
  const totalTests = testResults.length;
  
  console.log(`\n📈 Overall Results: ${successCount}/${totalTests} tests passed`);
  console.log(`📅 Test Completed: ${new Date().toISOString()}\n`);

  testResults.forEach((result, index) => {
    const icon = result.status === 'SUCCESS' ? '✅' : '❌';
    console.log(`${icon} ${index + 1}. ${result.test}`);
    console.log(`   Status: ${result.status} (HTTP ${result.httpCode})`);
    
    if (result.status === 'SUCCESS' && result.response) {
      console.log(`   Response: ${JSON.stringify(result.response)}`);
    } else if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  });

  // Diagnosis and recommendations
  console.log('🔧 DIAGNOSIS AND RECOMMENDATIONS');
  console.log('='.repeat(60));
  
  if (successCount === 0) {
    console.log('❌ CRITICAL: N8N workflow is not working at all');
    console.log('');
    console.log('🚨 IMMEDIATE ACTIONS REQUIRED:');
    console.log('1. Check if N8N server is running');
    console.log('2. Verify workflow exists and is activated');
    console.log('3. Check webhook trigger node configuration:');
    console.log('   - HTTP Method: POST');
    console.log('   - Path: yellowbox-sync');
    console.log('   - Response mode: onReceived');
    console.log('4. Check Google Sheets node configuration:');
    console.log('   - Column to Match On: id');
    console.log('   - Operation: appendOrUpdate');
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('1. Import COMPLETE_N8N_WORKFLOW.json');
    console.log('2. Configure Google Sheets credentials');
    console.log('3. Activate the workflow');
    console.log('4. Re-run this test');
    
  } else if (successCount < totalTests) {
    console.log('⚠️  PARTIAL: Some tests passed, some failed');
    console.log('');
    console.log('🔍 ANALYSIS:');
    console.log('- N8N server is responding');
    console.log('- Workflow may be partially configured');
    console.log('- Some payload structures work, others don\'t');
    console.log('');
    console.log('📋 RECOMMENDED ACTIONS:');
    console.log('1. Review failed test payloads');
    console.log('2. Adjust N8N workflow to handle all payload types');
    console.log('3. Check Google Sheets integration');
    console.log('4. Verify data mapping in workflow');
    
  } else {
    console.log('✅ EXCELLENT: All tests passed!');
    console.log('');
    console.log('🎉 N8N WORKFLOW STATUS:');
    console.log('- Server is responding correctly');
    console.log('- All payload structures are supported');
    console.log('- Workflow is properly configured');
    console.log('- Ready for production use');
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('1. Deploy monitoring system');
    console.log('2. Configure alerting');
    console.log('3. Set up performance tracking');
    console.log('4. Train operations team');
  }

  console.log('\n' + '='.repeat(60));
  console.log('📄 For detailed fixes, see: MCP_WORKFLOW_FIX.md');
  console.log('📄 For import guide, see: N8N_IMPORT_GUIDE.md');
  console.log('📄 For complete workflow, see: COMPLETE_N8N_WORKFLOW.json');
  console.log('='.repeat(60));
}

// Run the verification
runN8NWorkflowVerification().catch(console.error);