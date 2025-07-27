#!/usr/bin/env node

/**
 * Check n8n workflow executions to debug Google Sheets sync
 */

const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

console.log(`${YELLOW}📊 N8N Execution Debugger${RESET}\n`);

console.log(`${BLUE}Since the webhook tests are passing, but data isn't appearing in Google Sheets,${RESET}`);
console.log(`${BLUE}the issue is likely one of these:${RESET}\n`);

console.log(`${RED}1. Workflow Configuration Issues:${RESET}`);
console.log(`   ❌ Google Sheet ID still set to "YOUR_GOOGLE_SHEET_ID"`);
console.log(`   ❌ Google Sheets credentials not configured`);
console.log(`   ❌ Workflow is inactive (not toggled ON)`);
console.log(`   ❌ Field mappings don't match the data structure\n`);

console.log(`${RED}2. Google Sheets Issues:${RESET}`);
console.log(`   ❌ Missing required tabs (Riders, Expenses, Documents, Sync_Log)`);
console.log(`   ❌ Sheet not shared with service account`);
console.log(`   ❌ Incorrect permissions on the sheet\n`);

console.log(`${GREEN}What to check in n8n:${RESET}`);
console.log(`1. Go to: ${BLUE}https://n8n.srv924607.hstgr.cloud/${RESET}`);
console.log(`2. Click on "Workflows" in the left sidebar`);
console.log(`3. Find "Yellow Box - Real-time Data Sync"`);
console.log(`4. Click on the workflow name`);
console.log(`5. Look for the "Executions" tab\n`);

console.log(`${YELLOW}In the Executions tab, you should see:${RESET}`);
console.log(`- Recent executions from our tests`);
console.log(`- Click on any execution to see details`);
console.log(`- Look for ${RED}red error nodes${RESET} - these show where it's failing`);
console.log(`- Common errors:`);
console.log(`  • "No credentials set" - Need to configure Google Sheets auth`);
console.log(`  • "Invalid sheet ID" - Wrong Google Sheet ID`);
console.log(`  • "Sheet not found" - Tab names don't match`);
console.log(`  • "Cannot read property 'name'" - Field mapping issues\n`);

console.log(`${GREEN}Quick Fix Steps:${RESET}`);
console.log(`1. Edit the workflow (click "Open in Editor")`);
console.log(`2. Click on each Google Sheets node (they'll be red if failing)`);
console.log(`3. Configure:`);
console.log(`   • Document ID: Your actual Google Sheet ID`);
console.log(`   • Credentials: Set up Google Sheets OAuth or Service Account`);
console.log(`   • Test each node individually with "Execute Node"`);
console.log(`4. Don't forget to ${YELLOW}ACTIVATE${RESET} the workflow (toggle in top bar)\n`);

console.log(`${BLUE}To get your Google Sheet ID:${RESET}`);
console.log(`Open your sheet and look at the URL:`);
console.log(`https://docs.google.com/spreadsheets/d/${YELLOW}[THIS_PART_IS_YOUR_SHEET_ID]${RESET}/edit\n`);

console.log(`${GREEN}Once configured, run this test again:${RESET}`);
console.log(`${BLUE}npm run test-sheets${RESET}\n`);