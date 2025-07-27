#!/usr/bin/env node

/**
 * Complete Integration Test for Yellow Box → n8n → Google Sheets
 */

const WEBHOOK_URL = 'https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

async function sendTestData() {
  const timestamp = Date.now();
  const testData = {
    type: 'rider',
    id: `integration_test_${timestamp}`,
    action: 'created',
    data: {
      id: `integration_test_${timestamp}`,
      fullName: `Integration Test ${timestamp}`,
      email: `test${timestamp}@yellowbox.ae`,
      phone: '+971501234567',
      applicationStage: 'Applied',
      visaNumber: `VISA-${timestamp}`,
      createdAt: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  };

  console.log(`${BLUE}📤 Sending test data to n8n...${RESET}`);
  console.log(`Test ID: ${YELLOW}${testData.id}${RESET}\n`);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.text();
    console.log(`${GREEN}✅ Webhook Response:${RESET} ${result}`);
    console.log(`Status: ${response.status}\n`);
    
    return testData.id;
  } catch (error) {
    console.log(`${RED}❌ Webhook Error:${RESET} ${error.message}\n`);
    return null;
  }
}

async function checkN8nStatus() {
  console.log(`${BLUE}🔍 Checking n8n Status...${RESET}`);
  
  try {
    const response = await fetch('https://n8n.srv924607.hstgr.cloud/');
    console.log(`${GREEN}✅ n8n is accessible${RESET}`);
    console.log(`Status: ${response.status}\n`);
  } catch (error) {
    console.log(`${RED}❌ n8n is not accessible${RESET}`);
    console.log(`Error: ${error.message}\n`);
  }
}

function printInstructions(testId) {
  console.log(`${YELLOW}═══════════════════════════════════════════════════════════════${RESET}`);
  console.log(`${CYAN}📋 NEXT STEPS TO VERIFY THE INTEGRATION${RESET}`);
  console.log(`${YELLOW}═══════════════════════════════════════════════════════════════${RESET}\n`);
  
  console.log(`${GREEN}1. Check n8n Execution History:${RESET}`);
  console.log(`   • Go to: ${BLUE}https://n8n.srv924607.hstgr.cloud/${RESET}`);
  console.log(`   • Click on "Workflows" → "Yellow Box - Real-time Data Sync"`);
  console.log(`   • Click "Executions" tab`);
  console.log(`   • Look for execution with ID: ${YELLOW}${testId}${RESET}`);
  console.log(`   • If you see ${RED}red nodes${RESET}, click to see the error\n`);
  
  console.log(`${GREEN}2. Common n8n Errors and Solutions:${RESET}`);
  console.log(`   ${RED}❌ "No credentials set"${RESET}`);
  console.log(`      → Set up Google Sheets OAuth2 or Service Account`);
  console.log(`   ${RED}❌ "Invalid documentId"${RESET}`);
  console.log(`      → Replace YOUR_GOOGLE_SHEET_ID with actual ID`);
  console.log(`   ${RED}❌ "Workflow is not active"${RESET}`);
  console.log(`      → Toggle workflow to Active in n8n`);
  console.log(`   ${RED}❌ "Cannot read property 'name'"${RESET}`);
  console.log(`      → Change field mapping from 'name' to 'fullName'\n`);
  
  console.log(`${GREEN}3. Configure n8n Workflow:${RESET}`);
  console.log(`   • Edit workflow in n8n`);
  console.log(`   • For EACH Google Sheets node:`);
  console.log(`     - Set Document ID to your Sheet ID`);
  console.log(`     - Configure Credentials (OAuth2 or Service Account)`);
  console.log(`     - Fix field mappings:`);
  console.log(`       ${YELLOW}B: {{ $json.data.fullName }}${RESET} (not 'name')`);
  console.log(`       ${YELLOW}E: {{ $json.data.applicationStage }}${RESET} (not 'status')`);
  console.log(`   • ${YELLOW}ACTIVATE${RESET} the workflow!\n`);
  
  console.log(`${GREEN}4. Verify in Google Sheets:${RESET}`);
  console.log(`   • Open your Google Sheet`);
  console.log(`   • Check the "Riders" tab`);
  console.log(`   • Search for: ${YELLOW}${testId}${RESET}\n`);
  
  console.log(`${BLUE}📊 Google Sheet Requirements:${RESET}`);
  console.log(`   • Must have these tabs: ${YELLOW}Riders, Expenses, Documents, Sync_Log${RESET}`);
  console.log(`   • Headers in Riders tab:`);
  console.log(`     A: ID | B: Name | C: Email | D: Phone | E: Status`);
  console.log(`     F: Visa Number | G: License Number | H: Created At | I: Updated At\n`);
  
  console.log(`${CYAN}🔄 To run this test again:${RESET}`);
  console.log(`   ${BLUE}node test-complete-integration.js${RESET}\n`);
}

async function main() {
  console.log(`${YELLOW}🚀 Yellow Box → n8n → Google Sheets Integration Test${RESET}`);
  console.log(`${YELLOW}═══════════════════════════════════════════════════════════════${RESET}\n`);
  
  // Check n8n status
  await checkN8nStatus();
  
  // Send test data
  const testId = await sendTestData();
  
  if (testId) {
    console.log(`${GREEN}✅ Test data sent successfully!${RESET}\n`);
    
    // Wait a bit for processing
    console.log(`⏳ Waiting 5 seconds for n8n to process...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log(`✅ Processing time complete\n`);
    
    // Print instructions
    printInstructions(testId);
  } else {
    console.log(`${RED}❌ Failed to send test data${RESET}\n`);
  }
}

main().catch(error => {
  console.error(`${RED}Fatal error: ${error.message}${RESET}`);
  process.exit(1);
});