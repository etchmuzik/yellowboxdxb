#!/usr/bin/env node

/**
 * Test script to verify N8N webhook integration
 * Tests the yellowbox-sync webhook endpoint
 */

const WEBHOOK_URL = 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync';

async function testWebhook(payload, testName) {
  console.log(`\n🧪 Testing: ${testName}`);
  console.log(`📤 Payload:`, JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    
    if (response.ok) {
      console.log(`✅ Success (${response.status}): ${responseText}`);
      return true;
    } else {
      console.log(`❌ Failed (${response.status}): ${responseText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting N8N Webhook Integration Tests');
  console.log(`🔗 Webhook URL: ${WEBHOOK_URL}`);
  
  const tests = [
    {
      name: 'Basic Connectivity Test',
      payload: {
        type: 'test',
        id: 'test-connection',
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
          fullName: 'Test Rider',
          email: 'test@yellowbox.ae',
          phone: '+971501234567',
          nationality: 'United Arab Emirates',
          bikeType: 'Road Bike',
          applicationStage: 'Applied',
          joinDate: new Date().toISOString(),
          expectedStart: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
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
          amount: 150,
          category: 'Fuel',
          description: 'Test fuel expense',
          status: 'pending',
          submittedAt: new Date().toISOString()
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
    },
    {
      name: 'Batch Sync Test',
      payload: {
        batch: true,
        items: [
          {
            type: 'rider',
            id: 'batch-rider-1',
            action: 'updated',
            data: {
              id: 'batch-rider-1',
              fullName: 'Batch Test Rider 1',
              applicationStage: 'Active'
            }
          },
          {
            type: 'expense',
            id: 'batch-expense-1',
            action: 'updated',
            data: {
              id: 'batch-expense-1',
              status: 'approved',
              approvedBy: 'admin'
            }
          }
        ],
        timestamp: new Date().toISOString()
      }
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    const success = await testWebhook(test.payload, test.name);
    if (success) passedTests++;
    
    // Wait 1 second between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Webhook integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the N8N workflow configuration.');
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Check N8N workflow execution logs at: https://n8n.srv924607.hstgr.cloud');
  console.log('2. Verify Google Sheets integration is working');
  console.log('3. Test the webhook from the admin dashboard');
}

// Run the tests
runTests().catch(console.error);