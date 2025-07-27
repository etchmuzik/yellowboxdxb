#!/usr/bin/env node

const https = require('https');

// Check N8N server status and accessibility
async function checkN8NServerStatus() {
  console.log('🔍 N8N SERVER STATUS CHECK');
  console.log('==========================');
  console.log(`📅 Check Time: ${new Date().toISOString()}\n`);

  const checks = [
    {
      name: 'N8N Server Root',
      url: 'https://n8n.srv924607.hstgr.cloud/',
      method: 'GET'
    },
    {
      name: 'N8N Health Check',
      url: 'https://n8n.srv924607.hstgr.cloud/healthz',
      method: 'GET'
    },
    {
      name: 'N8N API Status',
      url: 'https://n8n.srv924607.hstgr.cloud/api/v1/workflows',
      method: 'GET'
    },
    {
      name: 'Specific Workflow URL',
      url: 'https://n8n.srv924607.hstgr.cloud/workflow/sm5RUQQwjr2cR4mB',
      method: 'GET'
    },
    {
      name: 'Webhook Endpoint',
      url: 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync',
      method: 'POST',
      data: { test: true }
    }
  ];

  for (const check of checks) {
    console.log(`🔍 Checking: ${check.name}`);
    console.log(`   URL: ${check.url}`);
    
    try {
      const result = await makeRequest(check.url, check.method, check.data);
      
      console.log(`   ✅ Status: ${result.status}`);
      console.log(`   📄 Response: ${typeof result.data === 'string' ? result.data.substring(0, 200) + '...' : JSON.stringify(result.data)}`);
      
      // Analyze response
      if (result.status === 200) {
        console.log(`   🎯 Result: Server responding normally`);
      } else if (result.status === 404) {
        console.log(`   ⚠️  Result: Endpoint not found`);
      } else if (result.status === 500) {
        console.log(`   ❌ Result: Server error - workflow issue`);
      } else {
        console.log(`   ❓ Result: Unexpected status code`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log(`   🎯 Result: Connection failed`);
    }
    
    console.log('');
  }

  console.log('🔧 ANALYSIS AND RECOMMENDATIONS');
  console.log('================================');
  console.log('Based on the checks above:');
  console.log('');
  console.log('If N8N server is responding (200 status):');
  console.log('  ✅ Server is running correctly');
  console.log('  ❌ Workflow configuration is the issue');
  console.log('  📋 Action: Import and configure workflow');
  console.log('');
  console.log('If getting 404 errors:');
  console.log('  ❌ Server may not be running');
  console.log('  ❌ URL/domain configuration issue');
  console.log('  📋 Action: Check server deployment');
  console.log('');
  console.log('If getting 500 errors on webhook:');
  console.log('  ✅ Server is running');
  console.log('  ❌ Webhook/workflow not configured');
  console.log('  📋 Action: Configure webhook trigger node');
  console.log('');
  console.log('If connection errors:');
  console.log('  ❌ Network/DNS issue');
  console.log('  ❌ Server may be down');
  console.log('  📋 Action: Check server infrastructure');
}

function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      method: method,
      headers: {
        'User-Agent': 'N8N-Status-Check/1.0'
      },
      timeout: 10000
    };

    if (postData) {
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

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Run the server status check
checkN8NServerStatus().catch(console.error);