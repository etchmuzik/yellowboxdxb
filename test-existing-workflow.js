#!/usr/bin/env node

const https = require('https');

// Test the existing workflow that we now know exists
async function testExistingWorkflow() {
  console.log('🔍 TESTING EXISTING N8N WORKFLOW');
  console.log('=================================');
  console.log('📋 Workflow ID: sm5RUQQwjr2cR4mB');
  console.log('📋 Execution ID: 132 (confirmed exists)');
  console.log(`📅 Test Time: ${new Date().toISOString()}\n`);

  // Test different webhook paths that might exist
  const webhookTests = [
    {
      name: 'Current Webhook Path',
      url: 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync',
      description: 'The path we\'ve been testing'
    },
    {
      name: 'Alternative Webhook Path 1',
      url: 'https://n8n.srv924607.hstgr.cloud/webhook/sm5RUQQwjr2cR4mB',
      description: 'Using workflow ID as path'
    },
    {
      name: 'Alternative Webhook Path 2', 
      url: 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox',
      description: 'Simplified path name'
    },
    {
      name: 'Alternative Webhook Path 3',
      url: 'https://n8n.srv924607.hstgr.cloud/webhook/sync',
      description: 'Generic sync path'
    },
    {
      name: 'Test Webhook Path',
      url: 'https://n8n.srv924607.hstgr.cloud/webhook-test/yellowbox-sync',
      description: 'Test environment path'
    }
  ];

  const testPayload = {
    id: 'test-rider-001',
    name: 'Test Rider',
    email: 'test@yellowbox.ae',
    phone: '+971501234567',
    status: 'applied',
    timestamp: new Date().toISOString()
  };

  console.log('🧪 Testing Multiple Webhook Paths...\n');

  for (const test of webhookTests) {
    console.log(`🔍 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    console.log(`   Description: ${test.description}`);
    
    try {
      const result = await makeRequest(test.url, testPayload);
      
      console.log(`   📊 Status: ${result.status}`);
      
      if (result.status === 200) {
        console.log(`   ✅ SUCCESS! Webhook is working`);
        console.log(`   📄 Response: ${JSON.stringify(result.data)}`);
        console.log(`   🎯 FOUND WORKING WEBHOOK PATH!`);
      } else if (result.status === 404) {
        console.log(`   ❌ Path not found`);
      } else if (result.status === 500) {
        console.log(`   ⚠️  Server error - workflow configuration issue`);
        console.log(`   📄 Error: ${JSON.stringify(result.data)}`);
      } else {
        console.log(`   ❓ Unexpected status: ${result.status}`);
        console.log(`   📄 Response: ${JSON.stringify(result.data)}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Connection Error: ${error.message}`);
    }
    
    console.log('');
  }

  // Test with different HTTP methods
  console.log('🔍 Testing Different HTTP Methods on Main Path...\n');
  
  const methods = ['GET', 'POST', 'PUT'];
  const mainUrl = 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync';
  
  for (const method of methods) {
    console.log(`🔍 Testing HTTP ${method}`);
    console.log(`   URL: ${mainUrl}`);
    
    try {
      const result = await makeRequestWithMethod(mainUrl, method, testPayload);
      
      console.log(`   📊 Status: ${result.status}`);
      
      if (result.status === 200) {
        console.log(`   ✅ SUCCESS with ${method}!`);
        console.log(`   📄 Response: ${JSON.stringify(result.data)}`);
      } else if (result.status === 404) {
        console.log(`   ❌ Method not allowed or path not found`);
      } else if (result.status === 500) {
        console.log(`   ⚠️  Server error`);
        console.log(`   📄 Error: ${JSON.stringify(result.data)}`);
      } else {
        console.log(`   ❓ Status: ${result.status}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }

  // Test workflow activation status
  console.log('🔍 Checking Workflow Activation Status...\n');
  
  try {
    // Try to access the workflow directly
    const workflowUrl = 'https://n8n.srv924607.hstgr.cloud/workflow/sm5RUQQwjr2cR4mB';
    const workflowResult = await makeRequestWithMethod(workflowUrl, 'GET');
    
    console.log(`📊 Workflow Page Status: ${workflowResult.status}`);
    
    if (workflowResult.status === 200) {
      console.log('✅ Workflow page accessible');
      console.log('🎯 This means the workflow exists and you have access');
    } else if (workflowResult.status === 404) {
      console.log('❌ Workflow not found or access denied');
    } else {
      console.log(`❓ Unexpected status: ${workflowResult.status}`);
    }
    
  } catch (error) {
    console.log(`❌ Cannot access workflow page: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 ANALYSIS AND RECOMMENDATIONS');
  console.log('='.repeat(60));
  console.log('');
  console.log('Since we know the workflow exists (execution 132 confirmed):');
  console.log('');
  console.log('✅ Workflow sm5RUQQwjr2cR4mB exists');
  console.log('✅ Workflow has executions (at least 132)');
  console.log('✅ N8N server is running');
  console.log('');
  console.log('Possible issues:');
  console.log('❓ Webhook trigger node path might be different');
  console.log('❓ Workflow might be deactivated');
  console.log('❓ Webhook trigger node HTTP method configuration');
  console.log('❓ Google Sheets node configuration issues');
  console.log('');
  console.log('Next steps:');
  console.log('1. Check if any webhook paths above worked');
  console.log('2. Access N8N UI to check workflow configuration');
  console.log('3. Verify webhook trigger node settings');
  console.log('4. Check workflow activation status');
  console.log('5. Review execution 132 details for clues');
}

function makeRequest(url, data) {
  return makeRequestWithMethod(url, 'POST', data);
}

function makeRequestWithMethod(url, method, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      method: method,
      headers: {
        'User-Agent': 'N8N-Workflow-Test/1.0'
      },
      timeout: 10000
    };

    if (postData && method !== 'GET') {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

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

    if (postData && method !== 'GET') {
      req.write(postData);
    }
    req.end();
  });
}

// Run the test
testExistingWorkflow().catch(console.error);