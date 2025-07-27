#!/usr/bin/env node

/**
 * N8N Workflow Diagnostic Tool
 * Helps identify why the workflow cannot be started
 */

console.log('🔍 N8N Workflow Diagnostic Analysis');
console.log('=' .repeat(60));

console.log('\n🚨 CURRENT ERROR:');
console.log('Error: "Workflow Webhook Error: Workflow could not be started!"');
console.log('Status: HTTP 500 (Internal Server Error)');
console.log('Endpoints: Both production and test failing');

console.log('\n🔧 POSSIBLE CAUSES:');
console.log('1. ❌ Workflow is not activated');
console.log('2. ❌ Missing required node configuration');
console.log('3. ❌ Authentication/credential issues');
console.log('4. ❌ Invalid node connections');
console.log('5. ❌ Google Sheets configuration errors');

console.log('\n📋 STEP-BY-STEP DIAGNOSIS:');

console.log('\n🔍 STEP 1: Check Workflow Activation');
console.log('→ Go to: https://n8n.srv924607.hstgr.cloud/workflow/sm5RUQQwjr2cR4mB');
console.log('→ Look for toggle switch in top-right corner');
console.log('→ Ensure it shows "Active" (not "Inactive")');
console.log('→ If inactive, click to activate');

console.log('\n🔍 STEP 2: Check Webhook Node Configuration');
console.log('→ Find the "Webhook" node (usually first node)');
console.log('→ Verify settings:');
console.log('   ✓ HTTP Method: POST');
console.log('   ✓ Path: yellowbox-sync');
console.log('   ✓ Response Mode: "Respond to Webhook"');

console.log('\n🔍 STEP 3: Check Google Sheets Node');
console.log('→ Find "Sync Expense Data1" node');
console.log('→ Check for red error indicators');
console.log('→ Verify required fields:');
console.log('   ✓ Operation: "Append or Update"');
console.log('   ✓ Document ID: [Your Google Sheets ID]');
console.log('   ✓ Sheet Name: "Expenses"');
console.log('   ✓ Column to Match On: "id" ← CRITICAL FIX');

console.log('\n🔍 STEP 4: Check Authentication');
console.log('→ Click on Google Sheets node');
console.log('→ Check "Credential for Google Sheets API"');
console.log('→ Ensure credential is properly configured');
console.log('→ Test credential if possible');

console.log('\n🔍 STEP 5: Check Node Connections');
console.log('→ Verify all nodes are properly connected');
console.log('→ No broken connections (red lines)');
console.log('→ Data flows from Webhook → Processing → Google Sheets');

console.log('\n🛠️  IMMEDIATE FIXES TO TRY:');

console.log('\n1️⃣ FIX THE GOOGLE SHEETS NODE:');
console.log('   → Click on "Sync Expense Data1" node');
console.log('   → Set "Column to Match On" to: id');
console.log('   → Save the node configuration');

console.log('\n2️⃣ ACTIVATE THE WORKFLOW:');
console.log('   → Click the toggle in top-right corner');
console.log('   → Ensure it shows "Active"');

console.log('\n3️⃣ TEST EXECUTION:');
console.log('   → Click "Execute Workflow" button');
console.log('   → Check for any error messages');
console.log('   → Fix any configuration issues');

console.log('\n🧪 TESTING SEQUENCE:');
console.log('After making fixes:');
console.log('1. Save all node configurations');
console.log('2. Activate the workflow');
console.log('3. Test with: node test-both-webhook-endpoints.js');
console.log('4. If working, test full flow: node test-complete-google-sheets-flow.js');

console.log('\n📊 EXPECTED RESULTS AFTER FIX:');
console.log('✅ Webhook responds with: {"message":"Workflow was started"}');
console.log('✅ No more "could not be started" errors');
console.log('✅ Data flows to Google Sheets successfully');

console.log('\n🚨 CRITICAL CONFIGURATION CHECKLIST:');
console.log('□ Workflow is activated');
console.log('□ Webhook node configured correctly');
console.log('□ Google Sheets node has "Column to Match On" = "id"');
console.log('□ Google Sheets credentials are valid');
console.log('□ All nodes are connected properly');
console.log('□ No red error indicators on nodes');

console.log('\n' + '=' .repeat(60));
console.log('🎯 PRIORITY: Fix Google Sheets "Column to Match On" parameter');
console.log('=' .repeat(60));