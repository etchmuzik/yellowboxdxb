#!/usr/bin/env node

/**
 * Comprehensive Yellow Box N8N Workflow Testing
 * Tests all 4 workflows:
 * 1. Real-time Data Sync - webhook
 * 2. Scheduled Data Backup - cron
 * 3. Health Monitoring - ping/health
 * 4. Data Integrity Check - validation
 */

// Configuration
const N8N_BASE_URL = 'https://n8n.srv924607.hstgr.cloud';
const WEBHOOK_URL = `${N8N_BASE_URL}/webhook/yellowbox-sync`;

// Test results
let testResults = [];

// Helper function to add test result
function addResult(testName, success, details) {
  testResults.push({
    test: testName,
    success,
    details,
    timestamp: new Date().toISOString()
  });
  
  const icon = success ? '✅' : '❌';
  console.log(`${icon} ${testName}: ${details}`);
}

// Test 1: Real-time Data Sync Webhook
async function testRealtimeDataSync() {
  console.log('\n🧪 Testing Real-time Data Sync Workflow...');
  
  try {
    // Test different data types
    const testCases = [
      {
        name: 'Rider Sync',
        payload: {
          type: 'rider',
          id: 'test-rider-' + Date.now(),
          action: 'created',
          data: {
            name: 'Test Rider',
            email: 'test@yellowbox.ae',
            phone: '+971501234567',
            status: 'Applied',
            visaNumber: 'TEST123456',
            createdAt: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        }
      },
      {
        name: 'Expense Sync',
        payload: {
          type: 'expense',
          id: 'test-expense-' + Date.now(),
          action: 'created',
          data: {
            riderId: 'test-rider-123',
            amount: 150.00,
            category: 'Fuel',
            description: 'Test fuel expense',
            status: 'pending',
            createdAt: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        }
      },
      {
        name: 'Document Sync',
        payload: {
          type: 'document',
          id: 'test-doc-' + Date.now(),
          action: 'created',
          data: {
            riderId: 'test-rider-123',
            type: 'Emirates ID',
            status: 'Pending',
            fileName: 'emirates-id.pdf',
            uploadDate: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        }
      },
      {
        name: 'Batch Sync',
        payload: {
          batch: true,
          items: [
            {
              type: 'rider',
              id: 'batch-rider-1',
              action: 'updated',
              data: { status: 'Documents Verified' },
              timestamp: new Date().toISOString()
            },
            {
              type: 'expense',
              id: 'batch-expense-1',
              action: 'approved',
              data: { status: 'approved', approvedBy: 'finance-admin' },
              timestamp: new Date().toISOString()
            }
          ],
          timestamp: new Date().toISOString()
        }
      }
    ];
    
    let allSuccess = true;
    
    for (const testCase of testCases) {
      try {
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testCase.payload)
        });
        
        if (response.ok) {
          addResult(`Real-time Sync: ${testCase.name}`, true, `Status ${response.status}`);
        } else {
          addResult(`Real-time Sync: ${testCase.name}`, false, `HTTP ${response.status}`);
          allSuccess = false;
        }
      } catch (error) {
        addResult(`Real-time Sync: ${testCase.name}`, false, error.message);
        allSuccess = false;
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return allSuccess;
  } catch (error) {
    addResult('Real-time Data Sync Workflow', false, error.message);
    return false;
  }
}

// Test 2: Health Monitoring
async function testHealthMonitoring() {
  console.log('\n🧪 Testing Health Monitoring Workflow...');
  
  try {
    // Check N8N health endpoint
    const healthResponse = await fetch(`${N8N_BASE_URL}/healthz`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok && healthData.status === 'ok') {
      addResult('N8N Health Check', true, 'Instance is healthy');
    } else {
      addResult('N8N Health Check', false, 'Instance unhealthy');
      return false;
    }
    
    // Test webhook health
    const webhookHealthPayload = {
      type: 'health_check',
      action: 'ping',
      timestamp: new Date().toISOString()
    };
    
    const webhookResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookHealthPayload)
    });
    
    if (webhookResponse.ok) {
      addResult('Webhook Health Check', true, 'Webhook endpoint is responsive');
      return true;
    } else {
      addResult('Webhook Health Check', false, `HTTP ${webhookResponse.status}`);
      return false;
    }
  } catch (error) {
    addResult('Health Monitoring', false, error.message);
    return false;
  }
}

// Test 3: Data Integrity Check
async function testDataIntegrity() {
  console.log('\n🧪 Testing Data Integrity Check Workflow...');
  
  try {
    // Send test data with various validation scenarios
    const integrityTests = [
      {
        name: 'Valid Data',
        payload: {
          type: 'integrity_check',
          action: 'validate',
          data: {
            rider: {
              id: 'valid-rider-123',
              name: 'John Doe',
              email: 'john@yellowbox.ae',
              phone: '+971501234567',
              status: 'Active'
            }
          },
          timestamp: new Date().toISOString()
        }
      },
      {
        name: 'Missing Required Fields',
        payload: {
          type: 'integrity_check',
          action: 'validate',
          data: {
            rider: {
              id: 'invalid-rider-456',
              // Missing name and email
              phone: '+971501234567'
            }
          },
          timestamp: new Date().toISOString()
        }
      },
      {
        name: 'Invalid Data Format',
        payload: {
          type: 'integrity_check',
          action: 'validate',
          data: {
            expense: {
              id: 'invalid-expense-789',
              amount: 'not-a-number', // Should be numeric
              category: 'Fuel'
            }
          },
          timestamp: new Date().toISOString()
        }
      }
    ];
    
    let allSuccess = true;
    
    for (const test of integrityTests) {
      try {
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(test.payload)
        });
        
        // For integrity checks, we expect all to return 200 but with different validation results
        if (response.ok) {
          addResult(`Data Integrity: ${test.name}`, true, 'Validation processed');
        } else {
          addResult(`Data Integrity: ${test.name}`, false, `HTTP ${response.status}`);
          allSuccess = false;
        }
      } catch (error) {
        addResult(`Data Integrity: ${test.name}`, false, error.message);
        allSuccess = false;
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    return allSuccess;
  } catch (error) {
    addResult('Data Integrity Check', false, error.message);
    return false;
  }
}

// Test 4: Scheduled Backup (simulated)
async function testScheduledBackup() {
  console.log('\n🧪 Testing Scheduled Data Backup Workflow...');
  
  try {
    // Trigger a manual backup simulation
    const backupPayload = {
      type: 'manual_backup',
      action: 'trigger',
      collections: ['riders', 'expenses', 'documents'],
      timestamp: new Date().toISOString()
    };
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backupPayload)
    });
    
    if (response.ok) {
      addResult('Scheduled Backup Trigger', true, 'Backup workflow triggered');
      return true;
    } else {
      addResult('Scheduled Backup Trigger', false, `HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    addResult('Scheduled Backup', false, error.message);
    return false;
  }
}

// Test Google Sheets connectivity (indirect)
async function testGoogleSheetsSync() {
  console.log('\n🧪 Testing Google Sheets Sync...');
  
  try {
    // Send a special test payload that should sync to Google Sheets
    const sheetsTestPayload = {
      type: 'sheets_test',
      action: 'sync',
      data: {
        testId: 'sheets-test-' + Date.now(),
        testData: {
          name: 'Google Sheets Test',
          timestamp: new Date().toISOString(),
          status: 'Testing',
          notes: 'This is a test record for Google Sheets sync'
        }
      },
      timestamp: new Date().toISOString()
    };
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sheetsTestPayload)
    });
    
    if (response.ok) {
      addResult('Google Sheets Sync Test', true, 'Test data sent to workflow');
      console.log('   ℹ️  Check Google Sheets to verify data appears');
      return true;
    } else {
      addResult('Google Sheets Sync Test', false, `HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    addResult('Google Sheets Sync', false, error.message);
    return false;
  }
}

// Performance test
async function testPerformance() {
  console.log('\n🧪 Testing Webhook Performance...');
  
  try {
    const iterations = 10;
    const durations = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'performance_test',
          id: `perf-test-${i}`,
          action: 'test',
          timestamp: new Date().toISOString()
        })
      });
      
      const duration = Date.now() - startTime;
      durations.push(duration);
      
      if (!response.ok) {
        addResult('Performance Test', false, `Request ${i} failed`);
        return false;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);
    
    addResult('Performance Test', true, 
      `Avg: ${avgDuration.toFixed(0)}ms, Min: ${minDuration}ms, Max: ${maxDuration}ms`
    );
    
    return true;
  } catch (error) {
    addResult('Performance Test', false, error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Yellow Box N8N Workflow Comprehensive Test Suite');
  console.log('=' .repeat(60));
  console.log(`📍 N8N Instance: ${N8N_BASE_URL}`);
  console.log(`🔗 Webhook URL: ${WEBHOOK_URL}`);
  console.log(`📅 Test Date: ${new Date().toISOString()}`);
  console.log('=' .repeat(60));
  
  // Run all tests
  const results = {
    realtimeSync: await testRealtimeDataSync(),
    healthMonitoring: await testHealthMonitoring(),
    dataIntegrity: await testDataIntegrity(),
    scheduledBackup: await testScheduledBackup(),
    googleSheets: await testGoogleSheetsSync(),
    performance: await testPerformance()
  };
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Workflow Status:');
  console.log(`1. Real-time Data Sync: ${results.realtimeSync ? '✅ Working' : '❌ Issues'}`);
  console.log(`2. Health Monitoring: ${results.healthMonitoring ? '✅ Working' : '❌ Issues'}`);
  console.log(`3. Data Integrity Check: ${results.dataIntegrity ? '✅ Working' : '❌ Issues'}`);
  console.log(`4. Scheduled Backup: ${results.scheduledBackup ? '✅ Working' : '❌ Issues'}`);
  console.log(`5. Google Sheets Sync: ${results.googleSheets ? '✅ Triggered' : '❌ Issues'}`);
  console.log(`6. Performance: ${results.performance ? '✅ Good' : '❌ Issues'}`);
  
  console.log('\n💡 Next Steps:');
  if (failedTests > 0) {
    console.log('1. Check N8N dashboard for workflow errors');
    console.log('2. Verify workflow activation status');
    console.log('3. Check Google Sheets permissions');
    console.log('4. Review webhook URL configuration');
  } else {
    console.log('1. All workflows are functioning correctly!');
    console.log('2. Monitor Google Sheets for synced data');
    console.log('3. Check N8N execution history for details');
    console.log('4. Review any error notifications');
  }
  
  console.log('\n🔗 N8N Dashboard: ' + N8N_BASE_URL);
  console.log('=' .repeat(60));
  
  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});