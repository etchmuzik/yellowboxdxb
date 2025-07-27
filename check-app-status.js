#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');

// Comprehensive Yellow Box App Status Check
async function checkAppStatus() {
  console.log('🔍 YELLOW BOX APP STATUS CHECK');
  console.log('==============================');
  console.log(`📅 Check Time: ${new Date().toISOString()}\n`);

  const statusReport = {
    infrastructure: {},
    applications: {},
    integrations: {},
    monitoring: {},
    overall: 'unknown'
  };

  // 1. Check Infrastructure Components
  console.log('🏗️  INFRASTRUCTURE STATUS');
  console.log('=========================\n');

  // Firebase Configuration
  const firebaseConfigExists = fs.existsSync('yellowboxdxb-main/firebase.json');
  const firebaseRulesExist = fs.existsSync('yellowboxdxb-main/firestore.rules');
  
  console.log(`📦 Firebase Configuration: ${firebaseConfigExists ? '✅ CONFIGURED' : '❌ MISSING'}`);
  console.log(`🔒 Firestore Rules: ${firebaseRulesExist ? '✅ CONFIGURED' : '❌ MISSING'}`);
  
  statusReport.infrastructure.firebase = firebaseConfigExists && firebaseRulesExist;

  // N8N Workflow Status
  console.log('\n🔍 Testing N8N Webhook...');
  try {
    const n8nResult = await testN8NWebhook();
    console.log(`🔗 N8N Webhook: ${n8nResult.working ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`   Status: ${n8nResult.status}`);
    console.log(`   Response: ${n8nResult.message}`);
    statusReport.infrastructure.n8n = n8nResult.working;
  } catch (error) {
    console.log(`🔗 N8N Webhook: ❌ ERROR - ${error.message}`);
    statusReport.infrastructure.n8n = false;
  }

  // 2. Check Application Components
  console.log('\n📱 APPLICATION STATUS');
  console.log('====================\n');

  // Main App
  const mainAppPackage = fs.existsSync('yellowboxdxb-main/package.json');
  const mainAppSrc = fs.existsSync('yellowboxdxb-main/src');
  const mainAppComponents = fs.existsSync('yellowboxdxb-main/src/components');
  
  console.log(`🏠 Main App Structure: ${mainAppPackage && mainAppSrc ? '✅ READY' : '❌ INCOMPLETE'}`);
  console.log(`   Package.json: ${mainAppPackage ? '✅' : '❌'}`);
  console.log(`   Source Code: ${mainAppSrc ? '✅' : '❌'}`);
  console.log(`   Components: ${mainAppComponents ? '✅' : '❌'}`);
  
  statusReport.applications.mainApp = mainAppPackage && mainAppSrc && mainAppComponents;

  // Simple App
  const simpleAppPackage = fs.existsSync('yellowbox-simple/package.json');
  const simpleAppSrc = fs.existsSync('yellowbox-simple/src');
  
  console.log(`🎯 Simple App: ${simpleAppPackage && simpleAppSrc ? '✅ READY' : '❌ INCOMPLETE'}`);
  console.log(`   Package.json: ${simpleAppPackage ? '✅' : '❌'}`);
  console.log(`   Source Code: ${simpleAppSrc ? '✅' : '❌'}`);
  
  statusReport.applications.simpleApp = simpleAppPackage && simpleAppSrc;

  // Firebase Functions
  const functionsPackage = fs.existsSync('yellowboxdxb-main/functions/package.json');
  const functionsIndex = fs.existsSync('yellowboxdxb-main/functions/src/index.ts');
  
  console.log(`⚡ Firebase Functions: ${functionsPackage && functionsIndex ? '✅ READY' : '❌ INCOMPLETE'}`);
  console.log(`   Package.json: ${functionsPackage ? '✅' : '❌'}`);
  console.log(`   Index.ts: ${functionsIndex ? '✅' : '❌'}`);
  
  statusReport.applications.functions = functionsPackage && functionsIndex;

  // 3. Check Key Features
  console.log('\n🎯 KEY FEATURES STATUS');
  console.log('=====================\n');

  // Rider Management
  const ridersPage = fs.existsSync('yellowboxdxb-main/src/pages/Riders.tsx');
  const riderComponents = fs.existsSync('yellowboxdxb-main/src/components/riders');
  
  console.log(`👥 Rider Management: ${ridersPage ? '✅ IMPLEMENTED' : '❌ MISSING'}`);
  console.log(`   Riders Page: ${ridersPage ? '✅' : '❌'}`);
  console.log(`   Rider Components: ${riderComponents ? '✅' : '❌'}`);

  // Expense Management
  const expensesPage = fs.existsSync('yellowboxdxb-main/src/pages/Expenses.tsx');
  const expenseComponents = fs.existsSync('yellowboxdxb-main/src/components/expenses');
  
  console.log(`💰 Expense Management: ${expensesPage ? '✅ IMPLEMENTED' : '❌ MISSING'}`);
  console.log(`   Expenses Page: ${expensesPage ? '✅' : '❌'}`);
  console.log(`   Expense Components: ${expenseComponents ? '✅' : '❌'}`);

  // Authentication
  const authComponents = fs.existsSync('yellowboxdxb-main/src/components/auth');
  const loginPage = fs.existsSync('yellowboxdxb-main/src/pages/Login.tsx');
  
  console.log(`🔐 Authentication: ${authComponents && loginPage ? '✅ IMPLEMENTED' : '❌ INCOMPLETE'}`);
  console.log(`   Auth Components: ${authComponents ? '✅' : '❌'}`);
  console.log(`   Login Page: ${loginPage ? '✅' : '❌'}`);

  // 4. Check Integrations
  console.log('\n🔗 INTEGRATIONS STATUS');
  console.log('=====================\n');

  // Webhook Service
  const webhookService = fs.existsSync('src/services/webhookService.ts');
  const webhookPanel = fs.existsSync('yellowboxdxb-main/src/components/admin/WebhookTestPanel.tsx');
  
  console.log(`🔗 Webhook Integration: ${webhookService ? '✅ IMPLEMENTED' : '❌ MISSING'}`);
  console.log(`   Webhook Service: ${webhookService ? '✅' : '❌'}`);
  console.log(`   Test Panel: ${webhookPanel ? '✅' : '❌'}`);
  
  statusReport.integrations.webhook = webhookService;

  // Google Sheets Integration (via N8N)
  const n8nWorkflow = fs.existsSync('COMPLETE_N8N_WORKFLOW.json');
  console.log(`📊 Google Sheets (N8N): ${n8nWorkflow && statusReport.infrastructure.n8n ? '✅ READY' : '❌ NEEDS SETUP'}`);
  statusReport.integrations.googleSheets = n8nWorkflow && statusReport.infrastructure.n8n;

  // 5. Check Monitoring Components
  console.log('\n📊 MONITORING STATUS');
  console.log('===================\n');

  const monitoringWorkflow = fs.existsSync('monitoring-workflow-complete.json');
  const webAppMonitoring = fs.existsSync('web-app-monitoring-integration.js');
  const alertingSystem = fs.existsSync('alerting-notification-system.ts');
  const fleetTracking = fs.existsSync('fleet-tracking-monitoring-config.ts');
  
  console.log(`📈 Monitoring Workflow: ${monitoringWorkflow ? '✅ READY' : '❌ MISSING'}`);
  console.log(`🌐 Web App Monitoring: ${webAppMonitoring ? '✅ READY' : '❌ MISSING'}`);
  console.log(`🚨 Alerting System: ${alertingSystem ? '✅ READY' : '❌ MISSING'}`);
  console.log(`🚛 Fleet Tracking: ${fleetTracking ? '✅ READY' : '❌ MISSING'}`);
  
  statusReport.monitoring.workflow = monitoringWorkflow;
  statusReport.monitoring.webApp = webAppMonitoring;
  statusReport.monitoring.alerting = alertingSystem;
  statusReport.monitoring.fleet = fleetTracking;

  // 6. Check MCP Server Integration
  console.log('\n🔌 MCP SERVER STATUS');
  console.log('===================\n');

  const mcpConfig = fs.existsSync('mcp-server-config.ts');
  const mcpIntegration = fs.existsSync('mcp-server-integration-prep.ts');
  const mcpArchitecture = fs.existsSync('YELLOWBOX_MCP_SERVER_INTEGRATION_ARCHITECTURE.md');
  
  console.log(`🔌 MCP Configuration: ${mcpConfig ? '✅ READY' : '❌ MISSING'}`);
  console.log(`🔗 MCP Integration: ${mcpIntegration ? '✅ READY' : '❌ MISSING'}`);
  console.log(`📋 MCP Architecture: ${mcpArchitecture ? '✅ DOCUMENTED' : '❌ MISSING'}`);
  
  statusReport.integrations.mcp = mcpConfig && mcpIntegration;

  // 7. Overall Status Assessment
  console.log('\n' + '='.repeat(50));
  console.log('📊 OVERALL STATUS ASSESSMENT');
  console.log('='.repeat(50));

  const infrastructureScore = Object.values(statusReport.infrastructure).filter(Boolean).length;
  const applicationScore = Object.values(statusReport.applications).filter(Boolean).length;
  const integrationScore = Object.values(statusReport.integrations).filter(Boolean).length;
  const monitoringScore = Object.values(statusReport.monitoring).filter(Boolean).length;

  console.log(`\n🏗️  Infrastructure: ${infrastructureScore}/2 components ready`);
  console.log(`📱 Applications: ${applicationScore}/3 components ready`);
  console.log(`🔗 Integrations: ${integrationScore}/3 components ready`);
  console.log(`📊 Monitoring: ${monitoringScore}/4 components ready`);

  const totalScore = infrastructureScore + applicationScore + integrationScore + monitoringScore;
  const maxScore = 12;
  const percentage = Math.round((totalScore / maxScore) * 100);

  console.log(`\n📈 Overall Readiness: ${totalScore}/${maxScore} (${percentage}%)`);

  // Status determination
  if (percentage >= 80) {
    statusReport.overall = 'production-ready';
    console.log('🎉 STATUS: PRODUCTION READY');
  } else if (percentage >= 60) {
    statusReport.overall = 'development-ready';
    console.log('🚀 STATUS: DEVELOPMENT READY');
  } else if (percentage >= 40) {
    statusReport.overall = 'partial';
    console.log('⚠️  STATUS: PARTIALLY READY');
  } else {
    statusReport.overall = 'needs-setup';
    console.log('❌ STATUS: NEEDS SETUP');
  }

  // 8. Recommendations
  console.log('\n🎯 RECOMMENDATIONS');
  console.log('==================\n');

  if (statusReport.overall === 'production-ready') {
    console.log('✅ System is ready for production deployment!');
    console.log('📋 Next steps:');
    console.log('   1. Deploy to production environment');
    console.log('   2. Configure monitoring and alerting');
    console.log('   3. Set up user training');
    console.log('   4. Implement backup procedures');
  } else if (statusReport.overall === 'development-ready') {
    console.log('🚀 System is ready for development and testing!');
    console.log('📋 Next steps:');
    console.log('   1. Start development server');
    console.log('   2. Test core functionality');
    console.log('   3. Complete remaining integrations');
    console.log('   4. Deploy monitoring system');
  } else {
    console.log('⚠️  System needs additional setup before use.');
    console.log('📋 Priority fixes:');
    
    if (!statusReport.infrastructure.firebase) {
      console.log('   - Configure Firebase (firebase.json, firestore.rules)');
    }
    if (!statusReport.infrastructure.n8n) {
      console.log('   - Fix N8N webhook integration');
    }
    if (!statusReport.applications.mainApp) {
      console.log('   - Complete main application setup');
    }
    if (!statusReport.integrations.webhook) {
      console.log('   - Implement webhook service');
    }
  }

  // 9. Quick Start Commands
  console.log('\n🚀 QUICK START COMMANDS');
  console.log('======================\n');

  console.log('# Start development server');
  console.log('cd yellowboxdxb-main && npm install && npm run dev');
  console.log('');

  console.log('# Test N8N integration');
  console.log('node test-n8n-webhook-status.js');
  console.log('');

  console.log('# Deploy Firebase Functions');
  console.log('cd yellowboxdxb-main/functions && npm run deploy');
  console.log('');

  console.log('# Run comprehensive tests');
  console.log('node test-expense-to-google-sheets.js');

  return statusReport;
}

// Test N8N webhook functionality
async function testN8NWebhook() {
  return new Promise((resolve) => {
    const testData = {
      type: 'status_check',
      timestamp: new Date().toISOString()
    };

    const postData = JSON.stringify(testData);
    const options = {
      hostname: 'n8n.srv924607.hstgr.cloud',
      path: '/webhook/yellowbox-sync',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            working: res.statusCode === 200,
            status: res.statusCode,
            message: response.message || data
          });
        } catch (e) {
          resolve({
            working: res.statusCode === 200,
            status: res.statusCode,
            message: data
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        working: false,
        status: 'ERROR',
        message: error.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        working: false,
        status: 'TIMEOUT',
        message: 'Request timeout'
      });
    });

    req.write(postData);
    req.end();
  });
}

// Run the status check
checkAppStatus().catch(console.error);