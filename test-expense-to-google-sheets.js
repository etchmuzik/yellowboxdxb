#!/usr/bin/env node

const https = require('https');

// Test expense data flow from webhook to Google Sheets
async function testExpenseToGoogleSheets() {
  console.log('💰 TESTING EXPENSE DATA FLOW TO GOOGLE SHEETS');
  console.log('==============================================');
  console.log('🎯 Goal: Verify expense data reaches Google Sheets');
  console.log(`📅 Test Time: ${new Date().toISOString()}\n`);

  const webhookUrl = 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync';

  // Test 1: Simple expense data (matching expected N8N structure)
  console.log('🔍 TEST 1: Simple Expense Data (N8N Expected Format)');
  console.log('───────────────────────────────────────────────────');
  
  const simpleExpenseData = {
    type: 'expense',
    id: 'exp_' + Date.now() + '_simple',
    riderId: 'rider_test_001',
    amount: 45.75,
    description: 'Fuel for delivery - Test 1',
    status: 'pending',
    timestamp: new Date().toISOString()
  };

  console.log('📦 Payload:', JSON.stringify(simpleExpenseData, null, 2));

  try {
    const result = await makeRequest(webhookUrl, simpleExpenseData);
    console.log(`📊 Status: ${result.status}`);
    console.log(`📄 Response: ${JSON.stringify(result.data, null, 2)}`);
    
    if (result.status === 200) {
      console.log('✅ SUCCESS: Simple expense data sent to N8N');
      console.log('🔍 Check: This should appear in Google Sheets');
    } else {
      console.log('❌ FAILED: Simple expense data not processed');
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }

  console.log('\n' + '⏱️  Waiting 3 seconds for Google Sheets processing...\n');
  await sleep(3000);

  // Test 2: Detailed expense data (Yellow Box web app format)
  console.log('🔍 TEST 2: Detailed Expense Data (Yellow Box Format)');
  console.log('──────────────────────────────────────────────────');
  
  const detailedExpenseData = {
    type: 'expense',
    action: 'created',
    data: {
      id: 'exp_' + Date.now() + '_detailed',
      riderId: 'rider_ahmed_001',
      category: 'Fuel',
      amount: 67.50,
      description: 'Petrol for delivery bike - Route 15',
      receiptUrl: 'https://storage.googleapis.com/yellowbox-receipts/receipt_' + Date.now() + '.jpg',
      status: 'pending',
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    timestamp: new Date().toISOString(),
    source: 'yellowbox-web-app',
    userId: 'user_operations_001'
  };

  console.log('📦 Payload:', JSON.stringify(detailedExpenseData, null, 2));

  try {
    const result = await makeRequest(webhookUrl, detailedExpenseData);
    console.log(`📊 Status: ${result.status}`);
    console.log(`📄 Response: ${JSON.stringify(result.data, null, 2)}`);
    
    if (result.status === 200) {
      console.log('✅ SUCCESS: Detailed expense data sent to N8N');
      console.log('🔍 Check: This should appear in Google Sheets');
    } else {
      console.log('❌ FAILED: Detailed expense data not processed');
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }

  console.log('\n' + '⏱️  Waiting 3 seconds for Google Sheets processing...\n');
  await sleep(3000);

  // Test 3: Multiple expense entries (batch test)
  console.log('🔍 TEST 3: Multiple Expense Entries (Batch Test)');
  console.log('────────────────────────────────────────────────');
  
  const expenseCategories = ['Fuel', 'Maintenance', 'Insurance', 'Parking', 'Tolls'];
  const riderIds = ['rider_001', 'rider_002', 'rider_003'];
  
  for (let i = 0; i < 5; i++) {
    const batchExpenseData = {
      type: 'expense',
      id: 'exp_batch_' + Date.now() + '_' + i,
      riderId: riderIds[i % riderIds.length],
      category: expenseCategories[i],
      amount: Math.round((Math.random() * 100 + 20) * 100) / 100, // Random amount between 20-120
      description: `${expenseCategories[i]} expense - Batch test ${i + 1}`,
      status: i % 2 === 0 ? 'pending' : 'approved',
      timestamp: new Date().toISOString()
    };

    console.log(`📦 Batch ${i + 1}:`, JSON.stringify(batchExpenseData, null, 2));

    try {
      const result = await makeRequest(webhookUrl, batchExpenseData);
      console.log(`   📊 Status: ${result.status}`);
      
      if (result.status === 200) {
        console.log(`   ✅ SUCCESS: Batch expense ${i + 1} processed`);
      } else {
        console.log(`   ❌ FAILED: Batch expense ${i + 1} failed`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }

    // Small delay between batch requests
    await sleep(1000);
  }

  console.log('\n' + '⏱️  Waiting 5 seconds for all Google Sheets processing...\n');
  await sleep(5000);

  // Test 4: Edge cases and validation
  console.log('🔍 TEST 4: Edge Cases and Validation');
  console.log('───────────────────────────────────');
  
  const edgeCases = [
    {
      name: 'Large Amount',
      data: {
        type: 'expense',
        id: 'exp_large_' + Date.now(),
        riderId: 'rider_test_large',
        amount: 999.99,
        description: 'Large expense test',
        status: 'pending',
        timestamp: new Date().toISOString()
      }
    },
    {
      name: 'Small Amount',
      data: {
        type: 'expense',
        id: 'exp_small_' + Date.now(),
        riderId: 'rider_test_small',
        amount: 0.01,
        description: 'Small expense test',
        status: 'pending',
        timestamp: new Date().toISOString()
      }
    },
    {
      name: 'Special Characters',
      data: {
        type: 'expense',
        id: 'exp_special_' + Date.now(),
        riderId: 'rider_test_special',
        amount: 25.50,
        description: 'Expense with special chars: áéíóú & @#$%',
        status: 'pending',
        timestamp: new Date().toISOString()
      }
    },
    {
      name: 'Long Description',
      data: {
        type: 'expense',
        id: 'exp_long_' + Date.now(),
        riderId: 'rider_test_long',
        amount: 55.25,
        description: 'This is a very long description for an expense that contains multiple words and should test how the Google Sheets integration handles longer text content without truncation or formatting issues.',
        status: 'pending',
        timestamp: new Date().toISOString()
      }
    }
  ];

  for (const testCase of edgeCases) {
    console.log(`🧪 Testing: ${testCase.name}`);
    console.log(`   Data: ${JSON.stringify(testCase.data)}`);

    try {
      const result = await makeRequest(webhookUrl, testCase.data);
      console.log(`   📊 Status: ${result.status}`);
      
      if (result.status === 200) {
        console.log(`   ✅ SUCCESS: ${testCase.name} processed`);
      } else {
        console.log(`   ❌ FAILED: ${testCase.name} failed`);
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }

    await sleep(1000);
  }

  // Final summary and Google Sheets check instructions
  console.log('\n' + '='.repeat(70));
  console.log('📊 EXPENSE TO GOOGLE SHEETS TEST SUMMARY');
  console.log('='.repeat(70));
  console.log('');
  console.log('🧪 TESTS COMPLETED:');
  console.log('✅ Simple expense data format');
  console.log('✅ Detailed Yellow Box format');
  console.log('✅ Multiple batch entries (5 expenses)');
  console.log('✅ Edge cases (large/small amounts, special chars, long text)');
  console.log('');
  console.log('📋 TOTAL EXPENSE RECORDS SENT: ~11 records');
  console.log('');
  console.log('🔍 NEXT STEPS - MANUAL VERIFICATION:');
  console.log('1. Open your Google Sheets document');
  console.log('2. Look for the "Expenses" tab/sheet');
  console.log('3. Check if the expense records appear with:');
  console.log('   - Correct expense IDs (exp_...)');
  console.log('   - Rider IDs');
  console.log('   - Amounts (45.75, 67.50, etc.)');
  console.log('   - Descriptions');
  console.log('   - Timestamps');
  console.log('   - Status (pending/approved)');
  console.log('');
  console.log('✅ IF DATA APPEARS IN GOOGLE SHEETS:');
  console.log('   - N8N workflow is fully functional');
  console.log('   - Google Sheets integration is working');
  console.log('   - Ready for production use');
  console.log('');
  console.log('❌ IF DATA DOES NOT APPEAR:');
  console.log('   - Check N8N workflow execution logs');
  console.log('   - Verify Google Sheets node configuration');
  console.log('   - Check Google Sheets API credentials');
  console.log('   - Verify sheet name and column mapping');
  console.log('');
  console.log('🔗 GOOGLE SHEETS TROUBLESHOOTING:');
  console.log('1. Check N8N execution history for errors');
  console.log('2. Verify Google Sheets document permissions');
  console.log('3. Confirm "Column to Match On" is set to "id"');
  console.log('4. Check if sheet has correct headers');
  console.log('');
  console.log('📄 Expected Google Sheets Headers:');
  console.log('id | riderId | type | amount | description | status | timestamp | receiptUrl');
  console.log('');
  console.log('🎯 RECOMMENDATION:');
  console.log('Check your Google Sheets now to see if the expense data');
  console.log('has been successfully synchronized from the N8N workflow!');
}

function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 15000 // Increased timeout for Google Sheets processing
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the comprehensive expense test
testExpenseToGoogleSheets().catch(console.error);