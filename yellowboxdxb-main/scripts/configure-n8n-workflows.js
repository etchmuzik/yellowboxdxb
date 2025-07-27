#!/usr/bin/env node
/**
 * Configure N8N Workflows for Yellow Box
 * This script helps configure the N8N workflows with proper credentials
 */

const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function configureWorkflows() {
  console.log('🔧 Yellow Box N8N Workflow Configuration\n');
  console.log('This script will help you configure your N8N workflows.\n');

  try {
    // Collect configuration values
    const config = {
      googleSheetId: '',
      firebaseProjectId: 'yellowbox-8e0e6',
      emailJsServiceId: '',
      emailJsTemplateId: '',
      emailJsUserId: '',
      alertEmail: ''
    };

    // Google Sheets Configuration
    console.log('📊 Google Sheets Configuration');
    console.log('1. Create a Google Sheet for Yellow Box data');
    console.log('2. Share it with your service account email');
    console.log('3. Copy the Sheet ID from the URL\n');
    
    config.googleSheetId = await question('Enter Google Sheet ID: ');

    // EmailJS Configuration (optional)
    console.log('\n📧 EmailJS Configuration (for alerts - optional, press Enter to skip)');
    config.emailJsServiceId = await question('Enter EmailJS Service ID: ');
    
    if (config.emailJsServiceId) {
      config.emailJsTemplateId = await question('Enter EmailJS Template ID: ');
      config.emailJsUserId = await question('Enter EmailJS User ID: ');
      config.alertEmail = await question('Enter alert recipient email: ');
    }

    // Create N8N configuration file
    const n8nConfig = {
      credentials: {
        googleSheets: {
          type: 'serviceAccount',
          email: 'YOUR_SERVICE_ACCOUNT_EMAIL',
          privateKey: 'YOUR_PRIVATE_KEY',
          sheetId: config.googleSheetId
        },
        emailJs: config.emailJsServiceId ? {
          serviceId: config.emailJsServiceId,
          templateId: config.emailJsTemplateId,
          userId: config.emailJsUserId
        } : null
      },
      workflows: {
        realTimeSync: {
          webhookUrl: 'http://localhost:5678/webhook/yellowbox-sync',
          enabled: true
        },
        scheduledBackup: {
          schedule: '0 */6 * * *', // Every 6 hours
          enabled: true
        },
        healthMonitoring: {
          schedule: '*/15 * * * *', // Every 15 minutes
          enabled: true,
          alertEmail: config.alertEmail
        },
        dataIntegrityCheck: {
          schedule: '0 0 * * *', // Daily at midnight
          enabled: true
        }
      },
      googleSheets: {
        spreadsheetId: config.googleSheetId,
        sheets: {
          riders: 'Riders',
          expenses: 'Expenses',
          documents: 'Documents',
          bikes: 'Bikes',
          backupLog: 'Backup Log',
          integrityLog: 'Integrity Log'
        }
      },
      firebase: {
        projectId: config.firebaseProjectId,
        collections: ['riders', 'expenses', 'documents', 'bikes', 'budgets']
      }
    };

    // Save configuration
    const configPath = path.join(__dirname, '..', 'n8n-config.json');
    await fs.writeFile(configPath, JSON.stringify(n8nConfig, null, 2));

    console.log('\n✅ Configuration saved to n8n-config.json');

    // Instructions for N8N setup
    console.log('\n📋 Next Steps:\n');
    console.log('1. In N8N, create the following credentials:');
    console.log('   - Google Sheets API (Service Account)');
    console.log('   - Google API (for Firestore access)');
    if (config.emailJsServiceId) {
      console.log('   - HTTP Request (for EmailJS)');
    }
    
    console.log('\n2. Import the workflows from n8n-workflows/ directory');
    
    console.log('\n3. Update each workflow with:');
    console.log(`   - Google Sheet ID: ${config.googleSheetId}`);
    console.log(`   - Firebase Project ID: ${config.firebaseProjectId}`);
    if (config.alertEmail) {
      console.log(`   - Alert Email: ${config.alertEmail}`);
    }
    
    console.log('\n4. Activate the workflows');
    
    console.log('\n5. Test the webhook:');
    console.log('   curl -X POST http://localhost:5678/webhook/yellowbox-sync \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"operation": "test", "data": {"message": "Hello N8N"}}\'');

    // Create test script
    const testScript = `#!/bin/bash
# Test N8N Webhook Integration

echo "Testing N8N webhook..."

curl -X POST http://localhost:5678/webhook/yellowbox-sync \\
  -H "Content-Type: application/json" \\
  -d '{
    "operation": "test",
    "data": {
      "message": "Test from configuration script",
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
    }
  }'

echo "\\nCheck N8N executions to verify the test was received."
`;

    const testScriptPath = path.join(__dirname, '..', 'test-n8n-webhook.sh');
    await fs.writeFile(testScriptPath, testScript);
    await fs.chmod(testScriptPath, '755');

    console.log('\n✅ Test script created: test-n8n-webhook.sh');
    console.log('Run ./test-n8n-webhook.sh to test the integration\n');

  } catch (error) {
    console.error('❌ Configuration failed:', error);
  } finally {
    rl.close();
  }
}

// Run configuration
configureWorkflows();