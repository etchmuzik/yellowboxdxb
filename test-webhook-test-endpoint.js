#!/usr/bin/env node

const https = require('https');

const TEST_WEBHOOK_URL = 'https://n8n.srv924607.hstgr.cloud/webhook-test/yellowbox-sync';
const PROD_WEBHOOK_URL = 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync';

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

// Test both webhook endpoints
async function testWebhookEndpoints() {
  console.log('🧪 TESTING WEBHOOK-TEST ENDPOINT');
  console.log('=================================');
  console.log(`📅 Test Time: ${new Date().toISOString()}\n`);

  const testPayloads = [
    {
      name: 'Basic Test Payload',
      data: {
        test: true,
        timestamp: new Date().toISOString()
      }
    },
    {
      name: 'Rider Data Payload',
      data: {
        type: 'rider',
        id: 'test-rider-001',
        name: 'Test Rider',
        email: 'test@yellowbox.ae',
        phone: '+971501234567',
        status: 'applied',
        timestamp: new Date().toISOString()
      }
    },
    {
      name: 'Web App Structure Payload',
      data: {
        type: 'rider',
        action: 'created',
        data: {
          id: 'test-rider-002',
          firstName: 'Ahmed',
          lastName: 'Al-Mansouri',
          email: 'ahmed@test.com',
          phone: '+971501234568',
          status: 'applied'
        },
        timestamp: new Date().toISOString()
      }
    },
    {
      name: 'Expense Data Payload',
      data: {
        type: 'expense',
        id: 'test-expense-001',
        riderId: 'test-rider-001',
        amount: 50.00,
        description: 'Test expense',
        status: 'pending',
        timestamp: new Date().toISOString()
      }
    }
  ];

  const endpoints = [
    { name: 'Test Endpoint', url: TEST_WEBHOOK_URL },
    { name: 'Production Endpoint', url: PROD_WEBHOOK_URL }
  ];

  const results = [];

  for (const endpoint of endpoints) {
    console.log(`🔍 TESTING: ${endpoint.name}`);
    console.log(`📡 URL: ${endpoint.url}`);
    console.log('─'.repeat(60));

    for (const payload of testPayloads) {
      console.log(`\n📦 Testing: ${payload.name}`);
      
      try {
        const response = await makeRequest(endpoint.url, payload.data);
        
        const result = {
          endpoint: endpoint.name,
          payload: payload.name,
          status: response.status < 400 ? 'SUCCESS' : 'FAILED',
          httpCode: response.status,
          response: response.data
        };
        
        results.push(result);
        
        if (response.status < 400) {
          console.log(`   ✅ SUCCESS - Status: ${response.status}`);
          console.log(`   📄 Response: ${JSON.stringify(response.data)}`);
        } else {
          console.log(`   ❌ FAILED - Status: ${response.status}`);
          console.log(`   📄 Response: ${JSON.stringify(response.data)}`);
        }
        
      } catch (error) {
        const result = {
          endpoint: endpoint.name,
          payload: payload.name,
          status: 'ERROR',
          httpCode: 'N/A',
          error: error.message
        };
        
        results.push(result);
        console.log(`   ❌ ERROR - ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
  }

  // Generate comparison report
  console.log('\n📊 ENDPOINT COMPARISON REPORT');
  console.log('='.repeat(60));
  
  const testEndpointResults = results.filter(r => r.endpoint === 'Test Endpoint');
  const prodEndpointResults = results.filter(r => r.endpoint === 'Production Endpoint');
  
  const testSuccessCount = testEndpointResults.filter(r => r.status === 'SUCCESS').length;
  const prodSuccessCount = prodEndpointResults.filter(r => r.status === 'SUCCESS').length;
  
  console.log(`\n🧪 Test Endpoint (/webhook-test/): ${testSuccessCount}/${testEndpointResults.length} tests passed`);
  console.log(`🚀 Production Endpoint (/webhook/): ${prodSuccessCount}/${prodEndpointResults.length} tests passed`);
  
  console.log('\n📋 DETAILED RESULTS:');
  console.log('─'.repeat(60));
  
  testPayloads.forEach((payload, index) => {
    const testResult = testEndpointResults[index];
    const prodResult = prodEndpointResults[index];
    
    console.log(`\n${index + 1}. ${payload.name}:`);
    console.log(`   Test Endpoint: ${testResult.status === 'SUCCESS' ? '✅' : '❌'} ${testResult.status} (${testResult.httpCode})`);
    console.log(`   Prod Endpoint: ${prodResult.status === 'SUCCESS' ? '✅' : '❌'} ${prodResult.status} (${prodResult.httpCode})`);
    
    if (testResult.status === 'SUCCESS' && testResult.response) {
      console.log(`   Test Response: ${JSON.stringify(testResult.response)}`);
    }
  });

  // Analysis and recommendations
  console.log('\n🔍 ANALYSIS AND RECOMMENDATIONS');
  console.log('='.repeat(60));
  
  if (testSuccessCount > prodSuccessCount) {
    console.log('🎯 FINDING: Test endpoint is working better than production!');
    console.log('');
    console.log('✅ RECOMMENDATIONS:');
    console.log('1. Test endpoint appears to be properly configured');
    console.log('2. Use test endpoint configuration as reference for production');
    console.log('3. Copy test workflow settings to production workflow');
    console.log('4. Test endpoint may be using a different workflow ID');
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('1. Identify the test workflow configuration');
    console.log('2. Export test workflow settings');
    console.log('3. Apply same configuration to production endpoint');
    console.log('4. Update Yellow Box integration to use working endpoint');
    
  } else if (testSuccessCount === prodSuccessCount && testSuccessCount === 0) {
    console.log('❌ FINDING: Both endpoints are failing');
    console.log('');
    console.log('🚨 RECOMMENDATIONS:');
    console.log('1. Both test and production workflows need configuration');
    console.log('2. Import COMPLETE_N8N_WORKFLOW.json for both endpoints');
    console.log('3. Configure Google Sheets credentials');
    console.log('4. Activate both workflows');
    
  } else if (testSuccessCount === prodSuccessCount && testSuccessCount > 0) {
    console.log('✅ FINDING: Both endpoints are working equally well');
    console.log('');
    console.log('🎉 RECOMMENDATIONS:');
    console.log('1. Both workflows are properly configured');
    console.log('2. Choose one endpoint for production use');
    console.log('3. Use the other for testing and development');
    console.log('4. Deploy monitoring system');
    
  } else {
    console.log('🤔 FINDING: Mixed results - further investigation needed');
    console.log('');
    console.log('📋 RECOMMENDATIONS:');
    console.log('1. Analyze which payloads work on which endpoints');
    console.log('2. Check workflow configurations for differences');
    console.log('3. Standardize configuration across both endpoints');
  }

  console.log('\n' + '='.repeat(60));
  console.log('📄 For workflow import: COMPLETE_N8N_WORKFLOW.json');
  console.log('📄 For configuration guide: N8N_IMPORT_GUIDE.md');
  console.log('📄 For detailed analysis: N8N_WORKFLOW_STATUS_REPORT.md');
  console.log('='.repeat(60));
}

// Run the test
testWebhookEndpoints().catch(console.error);