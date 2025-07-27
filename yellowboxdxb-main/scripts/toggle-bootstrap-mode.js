#!/usr/bin/env node
/**
 * Toggle Bootstrap Mode for Yellow Box
 * This script enables or disables bootstrap mode in Firestore security rules
 * 
 * Usage:
 *   node scripts/toggle-bootstrap-mode.js enable  - Enable bootstrap mode
 *   node scripts/toggle-bootstrap-mode.js disable - Disable bootstrap mode
 *   node scripts/toggle-bootstrap-mode.js status  - Check current status
 */

const fs = require('fs').promises;
const path = require('path');

const RULES_FILE = path.join(__dirname, '..', 'firestore.rules');

async function toggleBootstrapMode(action) {
  try {
    // Read the current rules
    let rulesContent = await fs.readFile(RULES_FILE, 'utf8');
    
    // Find the bootstrap mode line
    const bootstrapRegex = /let ENABLE_BOOTSTRAP = (true|false);/;
    const match = rulesContent.match(bootstrapRegex);
    
    if (!match) {
      console.error('❌ Could not find ENABLE_BOOTSTRAP setting in firestore.rules');
      process.exit(1);
    }
    
    const currentValue = match[1] === 'true';
    
    switch (action) {
      case 'status':
        console.log(`\n📊 Bootstrap Mode Status: ${currentValue ? '✅ ENABLED' : '❌ DISABLED'}\n`);
        if (currentValue) {
          console.log('⚠️  WARNING: Bootstrap mode is enabled. This should only be used for initial setup.');
          console.log('⚠️  Disable it immediately after creating the first admin account.\n');
        }
        break;
        
      case 'enable':
        if (currentValue) {
          console.log('ℹ️  Bootstrap mode is already enabled.');
        } else {
          rulesContent = rulesContent.replace(bootstrapRegex, 'let ENABLE_BOOTSTRAP = true;');
          await fs.writeFile(RULES_FILE, rulesContent);
          console.log('✅ Bootstrap mode ENABLED');
          console.log('\n⚠️  IMPORTANT: Bootstrap mode allows any authenticated user to create admin accounts.');
          console.log('⚠️  Use this only for initial setup, then disable it immediately.\n');
          console.log('Next steps:');
          console.log('1. Deploy the rules: firebase deploy --only firestore:rules');
          console.log('2. Create your admin account through the app');
          console.log('3. Run: node scripts/toggle-bootstrap-mode.js disable');
          console.log('4. Deploy the rules again to secure your app\n');
        }
        break;
        
      case 'disable':
        if (!currentValue) {
          console.log('ℹ️  Bootstrap mode is already disabled.');
        } else {
          rulesContent = rulesContent.replace(bootstrapRegex, 'let ENABLE_BOOTSTRAP = false;');
          await fs.writeFile(RULES_FILE, rulesContent);
          console.log('✅ Bootstrap mode DISABLED');
          console.log('\n🔒 Your Firestore is now secured.');
          console.log('Deploy the rules to apply changes: firebase deploy --only firestore:rules\n');
        }
        break;
        
      default:
        console.log('Usage:');
        console.log('  node scripts/toggle-bootstrap-mode.js enable  - Enable bootstrap mode');
        console.log('  node scripts/toggle-bootstrap-mode.js disable - Disable bootstrap mode');
        console.log('  node scripts/toggle-bootstrap-mode.js status  - Check current status');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get command line argument
const action = process.argv[2];
toggleBootstrapMode(action);