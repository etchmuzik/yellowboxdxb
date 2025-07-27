#!/usr/bin/env node

const https = require('https');

// Test the n8n webhook endpoint
async function testN8nWebhook() {
    console.log('🧪 Testing N8N Webhook Status...\n');
    
    // Test data matching our Yellow Box rider structure
    const testData = {
        id: 'test-rider-001',
        name: 'Test Rider',
        email: 'test@yellowbox.ae',
        phone: '+971501234567',
        status: 'applied',
        timestamp: new Date().toISOString()
    };

    const postData = JSON.stringify(testData);
    
    const options = {
        hostname: 'n8n.srv924607.hstgr.cloud',
        path: '/webhook/yellowbox-sync',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000
    };

    return new Promise((resolve, reject) => {
        console.log(`📡 Making POST request to: https://${options.hostname}${options.path}`);
        console.log(`📦 Payload:`, JSON.stringify(testData, null, 2));
        console.log('');

        const req = https.request(options, (res) => {
            let data = '';
            
            console.log(`📊 Response Status: ${res.statusCode}`);
            console.log(`📋 Response Headers:`, res.headers);
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`📄 Response Body: ${data}`);
                
                const result = {
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data,
                    success: res.statusCode >= 200 && res.statusCode < 300
                };
                
                if (result.success) {
                    console.log('✅ Webhook test SUCCESSFUL!');
                } else {
                    console.log('❌ Webhook test FAILED!');
                }
                
                resolve(result);
            });
        });

        req.on('error', (error) => {
            console.log('❌ Request Error:', error.message);
            reject(error);
        });

        req.on('timeout', () => {
            console.log('⏰ Request timed out');
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.write(postData);
        req.end();
    });
}

// Also test if the workflow page is accessible
async function testWorkflowPage() {
    console.log('\n🌐 Testing N8N Workflow Page Access...\n');
    
    const options = {
        hostname: 'n8n.srv924607.hstgr.cloud',
        path: '/workflow/sm5RUQQwjr2cR4mB',
        method: 'GET',
        timeout: 10000
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            console.log(`📊 Workflow Page Status: ${res.statusCode}`);
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const isAccessible = res.statusCode === 200 && data.includes('n8n');
                console.log(`🔍 Page accessible: ${isAccessible ? 'YES' : 'NO'}`);
                
                if (data.includes('workflow')) {
                    console.log('✅ Workflow page loaded successfully');
                } else {
                    console.log('⚠️  Workflow page may not be fully loaded');
                }
                
                resolve({
                    statusCode: res.statusCode,
                    accessible: isAccessible,
                    hasWorkflowContent: data.includes('workflow')
                });
            });
        });

        req.on('error', (error) => {
            console.log('❌ Page Access Error:', error.message);
            reject(error);
        });

        req.on('timeout', () => {
            console.log('⏰ Page access timed out');
            req.destroy();
            reject(new Error('Page access timeout'));
        });

        req.end();
    });
}

// Run tests
async function runTests() {
    try {
        console.log('🚀 Starting N8N Workflow Tests...\n');
        console.log('=' .repeat(50));
        
        // Test workflow page access
        await testWorkflowPage();
        
        console.log('\n' + '=' .repeat(50));
        
        // Test webhook endpoint
        const webhookResult = await testN8nWebhook();
        
        console.log('\n' + '=' .repeat(50));
        console.log('📋 SUMMARY:');
        console.log('=' .repeat(50));
        
        if (webhookResult.success) {
            console.log('✅ N8N webhook is working correctly');
            console.log('✅ Workflow appears to be properly configured');
            console.log('✅ Ready for Yellow Box integration');
        } else {
            console.log('❌ N8N webhook needs configuration');
            console.log('⚠️  Check the MCP_WORKFLOW_FIX.md for required fixes');
            console.log('⚠️  Ensure webhook path is set to "yellowbox-sync"');
            console.log('⚠️  Ensure HTTP method is set to "POST"');
        }
        
    } catch (error) {
        console.log('\n❌ Test failed with error:', error.message);
        console.log('\n🔧 Troubleshooting steps:');
        console.log('1. Check if N8N server is running');
        console.log('2. Verify workflow is activated');
        console.log('3. Check webhook configuration');
        console.log('4. Review MCP_WORKFLOW_FIX.md for detailed fixes');
    }
}

runTests();