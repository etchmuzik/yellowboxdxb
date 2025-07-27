#!/usr/bin/env node

/**
 * Quick webhook health test
 */

const WEBHOOK_URL = 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync';

const testCases = [
  {
    name: 'Basic Ping Test',
    payload: {
      type: 'test',
      action: 'ping',
      data: { message: 'Health check' },
      timestamp: new Date().toISOString()
    }
  },
  {
    name: 'Rider Data Test',
    payload: {
      type: 'rider',
      id: `quick-test-${Date.now()}`,
      action: 'created',
      data: {
        id: `quick-test-${Date.now()}`,
        name: 'Quick Test Rider',
        email: 'quicktest@yellowbox.ae',
        phone: '+971501234567',
        status: 'Applied'
      },
      timestamp: new Date().toISOString()
    }
  },
  {
    name: 'Expense Data Test',
    payload: {
      type: 'expense',
      id: `expense-${Date.now()}`,
      action: 'created',
      data: {
        id: `expense-${Date.now()}`,
        riderId: 'test-rider-123',
        amount: 75.00,
        category: 'Fuel',
        description: 'Quick test expense',
        status: 'pending'
      },
      timestamp: new Date().toISOString()
    }
  }
];

async function quickTest() {
  console.log('🚀 Quick Webhook Health Test');
  console.log(`🎯 Target: ${WEBHOOK_URL}`);
  console.log('=' .repeat(50));
  
  let successCount = 0;
  
  for (const testCase of testCases) {
    try {
      console.log(`\n🧪 ${testCase.name}`);
      
      const startTime = Date.now();
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.payload)
      });
      
      const duration = Date.now() - startTime;
      const responseData = await response.text();
      
      if (response.ok) {
        console.log(`✅ SUCCESS (${duration}ms) - ${responseData}`);
        successCount++;
      } else {
        console.log(`❌ FAILED (${response.status}) - ${responseData}`);
      }
      
    } catch (error) {
      console.log(`❌ ERROR - ${error.message}`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log(`📊 Results: ${successCount}/${testCases.length} tests passed`);
  
  if (successCount === testCases.length) {
    console.log('🎉 All tests passed! Webhook is healthy.');
  } else {
    console.log('⚠️  Some tests failed. Check webhook configuration.');
  }
}

quickTest();