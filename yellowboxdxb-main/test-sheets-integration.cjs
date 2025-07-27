#!/usr/bin/env node

/**
 * Yellow Box - Google Sheets Integration Test
 * Verifies that data flows from webhook → n8n → Google Sheets
 */

const axios = require('axios');
const { google } = require('googleapis');

// Configuration
const WEBHOOK_URL = 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

console.log(`${YELLOW}📊 Yellow Box - Google Sheets Integration Test${RESET}\n`);
console.log(`This test verifies the complete data flow:`);
console.log(`Web App → Webhook → n8n → Google Sheets\n`);

// Test data with unique identifiers
const testTimestamp = Date.now();
const testData = {
  rider: {
    id: `test_rider_${testTimestamp}`,
    fullName: `Test Rider ${testTimestamp}`,
    email: `test${testTimestamp}@yellowbox.ae`,
    phone: '+971501234567',
    nationality: 'UAE',
    visaNumber: `TEST-${testTimestamp}`,
    applicationStage: 'Applied',
    bikeType: 'Electric',
    testStatus: {
      theory: 'Pending',
      road: 'Pending',
      medical: 'Pending'
    },
    joinDate: new Date().toISOString(),
    notes: 'End-to-end integration test'
  },
  expense: {
    id: `test_expense_${testTimestamp}`,
    riderId: `test_rider_${testTimestamp}`,
    riderName: `Test Rider ${testTimestamp}`,
    category: 'Fuel',
    amountAed: 150,
    date: new Date().toISOString(),
    description: 'Integration test fuel expense',
    status: 'pending',
    receiptUrl: 'https://example.com/test-receipt.jpg'
  },
  document: {
    id: `test_doc_${testTimestamp}`,
    riderId: `test_rider_${testTimestamp}`,
    type: 'Visa',
    fileName: 'test-visa.pdf',
    fileUrl: 'https://example.com/test-visa.pdf',
    uploadDate: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Pending',
    notes: 'Test document for integration'
  }
};

// Google Sheets configuration
let sheets = null;
let auth = null;

// Initialize Google Sheets API
async function initializeGoogleSheets() {
  try {
    // Try to use service account
    const serviceAccount = require('./google-service-account.json');
    auth = new google.auth.GoogleAuth({
      credentials: serviceAccount,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    sheets = google.sheets({ version: 'v4', auth });
    console.log(`${GREEN}✅ Google Sheets API initialized${RESET}\n`);
    return true;
  } catch (error) {
    console.log(`${YELLOW}⚠️  Google Sheets API not configured${RESET}`);
    console.log(`   To enable Google Sheets verification:`);
    console.log(`   1. Download service account key from Google Cloud Console`);
    console.log(`   2. Save as google-service-account.json in project root`);
    console.log(`   3. Grant the service account read access to your Google Sheet\n`);
    return false;
  }
}

// Send webhook to n8n
async function sendWebhook(type, action, data) {
  const payload = {
    type,
    id: data.id,
    action,
    data,
    timestamp: new Date().toISOString()
  };

  try {
    console.log(`📤 Sending ${type} ${action} webhook...`);
    console.log(`   ID: ${data.id}`);
    
    const startTime = Date.now();
    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000
    });
    const duration = Date.now() - startTime;
    
    if (response.status === 200 || response.status === 202) {
      console.log(`${GREEN}✅ Webhook sent successfully (${duration}ms)${RESET}`);
      
      // Log response
      if (response.data) {
        console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
      }
      
      return { success: true, duration };
    } else {
      console.log(`${RED}❌ Webhook failed: Status ${response.status}${RESET}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`${RED}❌ Webhook error: ${error.message}${RESET}`);
    return { success: false, error: error.message };
  }
}

// Check if data appears in Google Sheets
async function checkGoogleSheets(sheetId, sheetName, searchValue) {
  if (!sheets) {
    console.log(`${YELLOW}⚠️  Skipping Google Sheets verification (API not configured)${RESET}`);
    return null;
  }

  try {
    console.log(`\n🔍 Checking Google Sheets for: ${searchValue}`);
    console.log(`   Sheet: ${sheetName}`);
    
    // Get sheet data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!A:Z`, // Get all columns
    });
    
    const rows = response.data.values || [];
    console.log(`   Total rows: ${rows.length}`);
    
    // Search for our test data
    let found = false;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.some(cell => cell && cell.toString().includes(searchValue))) {
        console.log(`${GREEN}✅ Found in row ${i + 1}${RESET}`);
        console.log(`   Data: ${row.slice(0, 5).join(' | ')}...`);
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.log(`${RED}❌ Not found in sheet${RESET}`);
    }
    
    return found;
  } catch (error) {
    console.log(`${RED}❌ Error checking sheet: ${error.message}${RESET}`);
    return false;
  }
}

// Main test flow
async function runEndToEndTest() {
  console.log(`${BLUE}1. Sending Test Data to n8n${RESET}`);
  console.log('─'.repeat(50));
  
  const webhookResults = [];
  
  // Test 1: Create rider
  const riderResult = await sendWebhook('rider', 'created', testData.rider);
  webhookResults.push({ type: 'rider', ...riderResult });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Create expense
  const expenseResult = await sendWebhook('expense', 'created', testData.expense);
  webhookResults.push({ type: 'expense', ...expenseResult });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 3: Create document
  const documentResult = await sendWebhook('document', 'created', testData.document);
  webhookResults.push({ type: 'document', ...documentResult });
  
  // All webhooks successful?
  const allWebhooksSuccessful = webhookResults.every(r => r.success);
  
  if (!allWebhooksSuccessful) {
    console.log(`\n${RED}⚠️  Some webhooks failed. Check n8n connectivity.${RESET}`);
    return;
  }
  
  console.log(`\n${BLUE}2. Waiting for n8n Processing${RESET}`);
  console.log('─'.repeat(50));
  console.log('⏳ Waiting 10 seconds for n8n to process and update Google Sheets...');
  
  // Progress indicator
  for (let i = 0; i < 10; i++) {
    process.stdout.write(`\r   ${10 - i} seconds remaining...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  console.log('\r   ✅ Wait complete                    ');
  
  console.log(`\n${BLUE}3. Verifying Google Sheets (if configured)${RESET}`);
  console.log('─'.repeat(50));
  
  // Ask user for Sheet ID if they want to verify
  if (sheets) {
    console.log(`\n${CYAN}Enter your Google Sheet ID to verify data:${RESET}`);
    console.log(`(Press Enter to skip verification)`);
    console.log(`Sheet ID format: 1ABC...xyz (from the URL)`);
    
    // For automated testing, you can hardcode the sheet ID here
    const SHEET_ID = process.env.GOOGLE_SHEET_ID || '';
    
    if (SHEET_ID) {
      const sheetResults = [];
      
      // Check each sheet
      const riderFound = await checkGoogleSheets(SHEET_ID, 'Riders', testData.rider.id);
      sheetResults.push({ type: 'Riders', found: riderFound });
      
      const expenseFound = await checkGoogleSheets(SHEET_ID, 'Expenses', testData.expense.id);
      sheetResults.push({ type: 'Expenses', found: expenseFound });
      
      const documentFound = await checkGoogleSheets(SHEET_ID, 'Documents', testData.document.id);
      sheetResults.push({ type: 'Documents', found: documentFound });
      
      // Summary
      console.log(`\n${BLUE}Google Sheets Verification Summary${RESET}`);
      console.log('─'.repeat(50));
      sheetResults.forEach(result => {
        const status = result.found === null ? '⏭️  Skipped' : 
                      result.found ? '✅ Found' : '❌ Not Found';
        console.log(`${result.type}: ${status}`);
      });
    }
  }
  
  // Final summary
  console.log(`\n${BLUE}4. Test Summary${RESET}`);
  console.log('═'.repeat(50));
  
  console.log(`\n${YELLOW}Webhook Tests:${RESET}`);
  webhookResults.forEach(result => {
    const status = result.success ? GREEN + '✅ Success' : RED + '❌ Failed';
    console.log(`  ${result.type}: ${status}${RESET} (${result.duration || 0}ms)`);
  });
  
  console.log(`\n${YELLOW}Test Data IDs:${RESET}`);
  console.log(`  Rider ID: ${testData.rider.id}`);
  console.log(`  Expense ID: ${testData.expense.id}`);
  console.log(`  Document ID: ${testData.document.id}`);
  
  console.log(`\n${YELLOW}Next Steps:${RESET}`);
  console.log('1. Check n8n execution history at:');
  console.log(`   ${BLUE}https://n8n.srv924607.hstgr.cloud/${RESET}`);
  console.log('2. Look for executions of "Yellow Box - Real-time Data Sync"');
  console.log('3. Check if Google Sheets were updated with the test data');
  console.log('4. Search for the test IDs in your Google Sheets');
  
  if (!sheets) {
    console.log(`\n${CYAN}💡 Tip: To enable automatic Google Sheets verification:${RESET}`);
    console.log('   1. Set up google-service-account.json');
    console.log('   2. Set GOOGLE_SHEET_ID environment variable');
    console.log('   3. Run: GOOGLE_SHEET_ID=your-sheet-id npm run test-sheets');
  }
}

// Check for required dependencies
async function checkDependencies() {
  try {
    require('googleapis');
    return true;
  } catch (error) {
    console.log(`${RED}❌ Missing dependency: googleapis${RESET}`);
    console.log(`\nPlease install it first:`);
    console.log(`${BLUE}npm install googleapis${RESET}\n`);
    return false;
  }
}

// Main execution
async function main() {
  // Check dependencies
  const depsOk = await checkDependencies();
  if (!depsOk) {
    process.exit(1);
  }
  
  // Initialize Google Sheets API (optional)
  await initializeGoogleSheets();
  
  // Run the test
  await runEndToEndTest();
  
  console.log(`\n${GREEN}✅ End-to-end test complete!${RESET}\n`);
}

// Run the test
if (require.main === module) {
  main().catch(error => {
    console.error(`${RED}💥 Fatal error: ${error.message}${RESET}`);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = { main, sendWebhook, checkGoogleSheets };