#!/usr/bin/env node

/**
 * Test script to simulate real webapp operations and verify N8N integration
 * This simulates adding riders and expenses like the actual webapp would do
 */

const axios = require('axios');

const WEBHOOK_URL = 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync';

// Simulate realistic Yellow Box data
const testData = {
  riders: [
    {
      id: `rider_${Date.now()}_1`,
      name: 'Ahmed Al Mansouri',
      email: 'ahmed.mansouri@email.com',
      phone: '+971501234567',
      status: 'Applied',
      visaNumber: 'UAE123456789',
      nationality: 'UAE',
      applicationStage: 'Applied',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: `rider_${Date.now()}_2`,
      name: 'Mohammed Hassan',
      email: 'mohammed.hassan@email.com',
      phone: '+971507654321',
      status: 'Docs Verified',
      visaNumber: 'UAE987654321',
      nationality: 'Pakistan',
      applicationStage: 'Docs Verified',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  expenses: [
    {
      id: `expense_${Date.now()}_1`,
      riderId: `rider_${Date.now()}_1`,
      amount: 150,
      category: 'Visa Fees',
      description: 'UAE Visa application fee',
      status: 'pending',
      receiptUrl: 'https://example.com/receipt1.pdf',
      createdAt: new Date().toISOString(),
      submittedBy: 'Ahmed Al Mansouri'
    },
    {
      id: `expense_${Date.now()}_2`,
      riderId: `rider_${Date.now()}_1`,
      amount: 75,
      category: 'RTA Tests',
      description: 'Theory test fee',
      status: 'approved',
      receiptUrl: 'https://example.com/receipt2.pdf',
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      approvedBy: 'Operations Manager'
    },
    {
      id: `expense_${Date.now()}_3`,
      riderId: `rider_${Date.now()}_2`,
      amount: 200,
      category: 'Medical',
      description: 'Medical examination',
      status: 'pending',
      receiptUrl: 'https://example.com/receipt3.pdf',
      createdAt: new Date().toISOString(),
      submittedBy: 'Mohammed Hassan'
    }
  ],
  documents: [
    {
      id: `doc_${Date.now()}_1`,
      riderId: `rider_${Date.now()}_1`,
      type: 'Visa',
      status: 'Valid',
      fileName: 'ahmed_visa.pdf',
      fileUrl: 'https://example.com/documents/ahmed_visa.pdf',
      uploadDate: new Date().toISOString(),
      expiryDate: '2025-12-31',
      verifiedBy: 'Operations Team'
    },
    {
      id: `doc_${Date.now()}_2`,
      riderId: `rider_${Date.now()}_1`,
      type: 'Emirates ID',
      status: 'Pending',
      fileName: 'ahmed_emirates_id.pdf',
      fileUrl: 'https://example.com/documents/ahmed_emirates_id.pdf',
      uploadDate: new Date().toISOString(),
      expiryDate: '2027-06-15'
    },
    {
      id: `doc_${Date.now()}_3`,
      riderId: `rider_${Date.now()}_2`,
      type: 'Driver License',
      status: 'Valid',
      fileName: 'mohammed_license.pdf',
      fileUrl: 'https://example.com/documents/mohammed_license.pdf',
      uploadDate: new Date().toISOString(),
      expiryDate: '2026-03-20',
      verifiedBy: 'Operations Team'
    }
  ]
};

async function sendWebhook(type, id, action, data) {
  try {
    const payload = {
      type,
      id,
      action,
      data,
      timestamp: new Date().toISOString(),
      source: 'webapp-simulation'
    };

    console.log(`📤 Sending ${type} ${action}: ${data.name || data.description || data.type || id}`);
    
    const startTime = Date.now();
    const response = await axios.post(WEBHOOK_URL, payload, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const duration = Date.now() - startTime;
    
    if (response.status === 200) {
      console.log(`   ✅ Success (${duration}ms): ${response.data.message || 'OK'}`);
      return { success: true, duration };
    } else {
      console.log(`   ❌ Failed: Status ${response.status}`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function simulateRiderLifecycle() {
  console.log('\n🚀 Simulating Rider Lifecycle Operations');
  console.log('=' .repeat(50));
  
  const results = [];
  
  // 1. Create riders
  console.log('\n👤 Creating Riders...');
  for (const rider of testData.riders) {
    const result = await sendWebhook('rider', rider.id, 'created', rider);
    results.push({ operation: 'rider_created', ...result });
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between operations
  }
  
  // 2. Update rider status
  console.log('\n📝 Updating Rider Status...');
  const updatedRider = { ...testData.riders[0], status: 'Theory Test', applicationStage: 'Theory Test', updatedAt: new Date().toISOString() };
  const result = await sendWebhook('rider', updatedRider.id, 'updated', updatedRider);
  results.push({ operation: 'rider_updated', ...result });
  
  return results;
}

async function simulateExpenseWorkflow() {
  console.log('\n💰 Simulating Expense Workflow');
  console.log('=' .repeat(50));
  
  const results = [];
  
  // 1. Create expenses
  console.log('\n💸 Creating Expenses...');
  for (const expense of testData.expenses) {
    const result = await sendWebhook('expense', expense.id, 'created', expense);
    results.push({ operation: 'expense_created', ...result });
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 2. Approve an expense
  console.log('\n✅ Approving Expense...');
  const approvedExpense = { 
    ...testData.expenses[0], 
    status: 'approved', 
    approvedAt: new Date().toISOString(),
    approvedBy: 'Finance Manager'
  };
  const result = await sendWebhook('expense', approvedExpense.id, 'updated', approvedExpense);
  results.push({ operation: 'expense_approved', ...result });
  
  // 3. Reject an expense
  console.log('\n❌ Rejecting Expense...');
  const rejectedExpense = { 
    ...testData.expenses[2], 
    status: 'rejected', 
    rejectedAt: new Date().toISOString(),
    rejectedBy: 'Finance Manager',
    rejectionReason: 'Invalid receipt format'
  };
  const result2 = await sendWebhook('expense', rejectedExpense.id, 'updated', rejectedExpense);
  results.push({ operation: 'expense_rejected', ...result2 });
  
  return results;
}

async function simulateDocumentManagement() {
  console.log('\n📄 Simulating Document Management');
  console.log('=' .repeat(50));
  
  const results = [];
  
  // 1. Upload documents
  console.log('\n📤 Uploading Documents...');
  for (const document of testData.documents) {
    const result = await sendWebhook('document', document.id, 'created', document);
    results.push({ operation: 'document_uploaded', ...result });
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 2. Verify a document
  console.log('\n✅ Verifying Document...');
  const verifiedDocument = { 
    ...testData.documents[1], 
    status: 'Valid', 
    verifiedAt: new Date().toISOString(),
    verifiedBy: 'Operations Manager'
  };
  const result = await sendWebhook('document', verifiedDocument.id, 'updated', verifiedDocument);
  results.push({ operation: 'document_verified', ...result });
  
  return results;
}

async function simulateBatchOperations() {
  console.log('\n📦 Simulating Batch Operations');
  console.log('=' .repeat(50));
  
  const batchPayload = {
    batch: true,
    items: [
      {
        type: 'rider',
        id: `batch_rider_${Date.now()}`,
        action: 'created',
        data: {
          id: `batch_rider_${Date.now()}`,
          name: 'Batch Test Rider',
          email: 'batch@test.com',
          phone: '+971501111111',
          status: 'Applied'
        },
        timestamp: new Date().toISOString()
      },
      {
        type: 'expense',
        id: `batch_expense_${Date.now()}`,
        action: 'created',
        data: {
          id: `batch_expense_${Date.now()}`,
          riderId: `batch_rider_${Date.now()}`,
          amount: 50,
          category: 'Fuel',
          description: 'Batch test expense',
          status: 'pending'
        },
        timestamp: new Date().toISOString()
      }
    ],
    timestamp: new Date().toISOString(),
    source: 'batch-simulation'
  };
  
  try {
    console.log('📤 Sending batch payload with 2 items...');
    const response = await axios.post(WEBHOOK_URL, batchPayload, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (response.status === 200) {
      console.log('   ✅ Batch operation successful');
      return { success: true };
    } else {
      console.log(`   ❌ Batch operation failed: Status ${response.status}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ Batch operation error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function generateSummaryReport(allResults) {
  console.log('\n📊 Integration Test Summary Report');
  console.log('=' .repeat(60));
  
  const totalOperations = allResults.length;
  const successfulOperations = allResults.filter(r => r.success).length;
  const failedOperations = totalOperations - successfulOperations;
  
  console.log(`\n📈 Overall Statistics:`);
  console.log(`   Total Operations: ${totalOperations}`);
  console.log(`   Successful: ${successfulOperations} (${((successfulOperations/totalOperations)*100).toFixed(1)}%)`);
  console.log(`   Failed: ${failedOperations}`);
  
  if (successfulOperations > 0) {
    const durations = allResults.filter(r => r.duration).map(r => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    
    console.log(`\n⏱️  Performance Metrics:`);
    console.log(`   Average Response Time: ${avgDuration.toFixed(0)}ms`);
    console.log(`   Fastest Response: ${minDuration}ms`);
    console.log(`   Slowest Response: ${maxDuration}ms`);
  }
  
  console.log(`\n🔗 Webhook Endpoint: ${WEBHOOK_URL}`);
  console.log(`\n✅ Integration Status: ${successfulOperations === totalOperations ? 'FULLY OPERATIONAL' : 'NEEDS ATTENTION'}`);
  
  if (failedOperations > 0) {
    console.log(`\n❌ Failed Operations:`);
    allResults.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.operation}: ${r.error || r.status || 'Unknown error'}`);
    });
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('   1. Check N8N workflow execution logs');
  console.log('   2. Verify Google Sheets are being updated');
  console.log('   3. Test actual webapp operations');
  console.log('   4. Monitor real-time sync performance');
}

async function main() {
  console.log('🧪 Yellow Box Webapp Integration Test');
  console.log('Testing N8N Cloud webhook integration with realistic data');
  console.log(`🎯 Target: ${WEBHOOK_URL}`);
  console.log('=' .repeat(60));
  
  const allResults = [];
  
  try {
    // Run all simulation tests
    const riderResults = await simulateRiderLifecycle();
    const expenseResults = await simulateExpenseWorkflow();
    const documentResults = await simulateDocumentManagement();
    
    allResults.push(...riderResults, ...expenseResults, ...documentResults);
    
    // Test batch operations
    await new Promise(resolve => setTimeout(resolve, 1000));
    const batchResult = await simulateBatchOperations();
    allResults.push({ operation: 'batch_operations', ...batchResult });
    
    // Generate summary
    await generateSummaryReport(allResults);
    
  } catch (error) {
    console.error('💥 Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  });
}

module.exports = { main, simulateRiderLifecycle, simulateExpenseWorkflow, simulateDocumentManagement };