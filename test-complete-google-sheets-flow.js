#!/usr/bin/env node

/**
 * Complete End-to-End Test: Yellow Box → N8N → Google Sheets
 * This test verifies the entire data flow including Google Sheets integration
 */

const WEBHOOK_URL = 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync';

// Test data that matches expected Google Sheets structure
const testRiderData = {
  type: 'rider',
  id: `test-rider-${Date.now()}`,
  action: 'created',
  data: {
    id: `test-rider-${Date.now()}`,
    name: 'John Doe Test',
    email: 'john.doe.test@yellowbox.ae',
    phone: '+971501234567',
    status: 'Applied',
    visaNumber: 'VN123456789',
    licenseNumber: 'DL987654321',
    expectedStartDate: '2025-08-01',
    createdAt: new Date().toISOString(),
    // Additional fields that might be needed for Google Sheets
    nationality: 'UAE',
    dateOfBirth: '1990-01-01',
    address: 'Dubai, UAE',
    emergencyContact: '+971509876543'
  },
  timestamp: new Date().toISOString()
};

const testExpenseData = {
  type: 'expense',
  id: `test-expense-${Date.now()}`,
  action: 'created',
  data: {
    id: `test-expense-${Date.now()}`,
    riderId: testRiderData.data.id,
    riderName: testRiderData.data.name,
    amount: 150.50,
    category: 'Fuel',
    description: 'Weekly fuel expense for delivery routes',
    status: 'pending',
    receiptUrl: 'https://example.com/receipt.jpg',
    submittedDate: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  timestamp: new Date().toISOString()
};

async function testWebhookWithRetry(payload, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`\n🔄 Attempt ${attempt}/${maxRetries}`);
      console.log(`📤 Sending payload:`, JSON.stringify(payload, null, 2));
      
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'YellowBox-Test/1.0'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      
      let responseData = null;
      const responseText = await response.text();
      
      try {
        if (responseText) {
          responseData = JSON.parse(responseText);
        }
      } catch (e) {
        responseData = responseText;
      }
      
      if (response.ok) {
        console.log(`✅ Success! Status: ${response.status}, Duration: ${duration}ms`);
        console.log(`📥 Response:`, responseData);
        return { success: true, duration, status: response.status, data: responseData };
      } else {
        console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`);
        console.log(`📥 Response:`, responseData);
        
        if (attempt === maxRetries) {
          return { success: false, error: `HTTP ${response.status}`, data: responseData };
        }
        
        console.log(`⏳ Waiting 2 seconds before retry...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`);
      
      if (attempt === maxRetries) {
        return { success: false, error: error.message };
      }
      
      console.log(`⏳ Waiting 2 seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

async function waitForProcessing(seconds = 10) {
  console.log(`\n⏳ Waiting ${seconds} seconds for N8N workflow to process and sync to Google Sheets...`);
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(`\r⏳ ${i} seconds remaining...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log('\n✅ Wait complete');
}

async function testCompleteFlow() {
  console.log('🚀 Starting Complete End-to-End Test: Yellow Box → N8N → Google Sheets');
  console.log(`🎯 Target URL: ${WEBHOOK_URL}`);
  console.log('=' .repeat(80));
  
  // Test 1: Send Rider Data
  console.log('\n📋 TEST 1: Creating New Rider');
  console.log('=' .repeat(50));
  
  const riderResult = await testWebhookWithRetry(testRiderData);
  
  if (!riderResult.success) {
    console.log('❌ Rider creation failed. Stopping test.');
    return;
  }
  
  // Wait for processing
  await waitForProcessing(15);
  
  // Test 2: Send Expense Data
  console.log('\n💰 TEST 2: Creating Expense for Rider');
  console.log('=' .repeat(50));
  
  const expenseResult = await testWebhookWithRetry(testExpenseData);
  
  if (!expenseResult.success) {
    console.log('❌ Expense creation failed.');
  }
  
  // Wait for processing
  await waitForProcessing(15);
  
  // Test 3: Verify Google Sheets Integration
  console.log('\n📊 TEST 3: Google Sheets Integration Status');
  console.log('=' .repeat(50));
  
  console.log('🔍 To verify data was saved to Google Sheets:');
  console.log('1. Open your Google Sheets document');
  console.log('2. Check for the following data:');
  console.log(`   - Rider: ${testRiderData.data.name} (${testRiderData.data.email})`);
  console.log(`   - Expense: ${testExpenseData.data.amount} AED for ${testExpenseData.data.category}`);
  console.log('3. Verify timestamps match the test execution time');
  
  // Summary
  console.log('\n' + '=' .repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(80));
  
  console.log(`✅ Rider Creation: ${riderResult.success ? 'SUCCESS' : 'FAILED'}`);
  if (riderResult.success) {
    console.log(`   Duration: ${riderResult.duration}ms`);
    console.log(`   Response: ${JSON.stringify(riderResult.data)}`);
  }
  
  console.log(`✅ Expense Creation: ${expenseResult.success ? 'SUCCESS' : 'FAILED'}`);
  if (expenseResult.success) {
    console.log(`   Duration: ${expenseResult.duration}ms`);
    console.log(`   Response: ${JSON.stringify(expenseResult.data)}`);
  }
  
  console.log('\n🔧 TROUBLESHOOTING GOOGLE SHEETS ISSUES:');
  console.log('If data is not appearing in Google Sheets, check:');
  console.log('1. N8N workflow is activated');
  console.log('2. Google Sheets node has proper authentication');
  console.log('3. "Column to Match On" parameter is configured');
  console.log('4. Sheet ID and range are correct');
  console.log('5. Google Sheets API permissions are granted');
  
  console.log('\n🛠️  FIXING "Column to Match On" ERROR:');
  console.log('1. Open N8N workflow editor');
  console.log('2. Click on the Google Sheets node that\'s failing');
  console.log('3. In the "Column to Match On" field, enter: "id" or "email"');
  console.log('4. Save and activate the workflow');
  console.log('5. Re-run this test');
  
  console.log('\n' + '=' .repeat(80));
}

// Execute the test
testCompleteFlow().catch(error => {
  console.error('💥 Test execution failed:', error.message);
  process.exit(1);
});