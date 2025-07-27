#!/usr/bin/env node

/**
 * N8N Workflow Configuration Guide using MCP Tools Analysis
 */

console.log('🔧 N8N Workflow Configuration Guide (MCP Analysis)');
console.log('=' .repeat(70));

console.log('\n📋 WEBHOOK TRIGGER NODE CONFIGURATION:');
console.log('Based on MCP analysis of nodes-base.webhook:');

const webhookConfig = {
  "id": "webhook-trigger",
  "name": "Webhook Trigger",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 2.1,
  "position": [250, 300],
  "parameters": {
    "httpMethod": "POST",
    "path": "yellowbox-sync",
    "responseMode": "onReceived",
    "responseData": "firstEntryJson",
    "responseCode": 200
  }
};

console.log('Webhook Node Configuration:');
console.log(JSON.stringify(webhookConfig, null, 2));

console.log('\n📊 GOOGLE SHEETS NODE CONFIGURATION:');
console.log('Based on MCP analysis of nodes-base.googleSheets:');

const googleSheetsConfig = {
  "id": "google-sheets-sync",
  "name": "Sync Expense Data1",
  "type": "n8n-nodes-base.googleSheets",
  "typeVersion": 4.6,
  "position": [450, 300],
  "parameters": {
    "authentication": "oAuth2",
    "resource": "sheet",
    "operation": "appendOrUpdate",
    "documentId": {
      "mode": "list",
      "value": "YOUR_GOOGLE_SHEETS_ID_HERE"
    },
    "sheetName": {
      "mode": "list", 
      "value": "Expenses"
    },
    "columns": {
      "mappingMode": "defineBelow",
      "value": {
        "id": "={{ $json.data.id }}",
        "riderId": "={{ $json.data.riderId }}",
        "riderName": "={{ $json.data.riderName }}",
        "amount": "={{ $json.data.amount }}",
        "category": "={{ $json.data.category }}",
        "description": "={{ $json.data.description }}",
        "status": "={{ $json.data.status }}",
        "receiptUrl": "={{ $json.data.receiptUrl }}",
        "submittedDate": "={{ $json.data.submittedDate }}",
        "createdAt": "={{ $json.data.createdAt }}"
      },
      "matchingColumns": [
        {
          "field": "id"
        }
      ]
    }
  },
  "credentials": {
    "googleSheetsOAuth2Api": {
      "id": "YOUR_GOOGLE_SHEETS_CREDENTIAL_ID",
      "name": "Google Sheets OAuth2 API"
    }
  }
};

console.log('Google Sheets Node Configuration:');
console.log(JSON.stringify(googleSheetsConfig, null, 2));

console.log('\n🔗 WORKFLOW CONNECTIONS:');
const connections = {
  "Webhook Trigger": {
    "main": [
      [
        {
          "node": "Sync Expense Data1",
          "type": "main",
          "index": 0
        }
      ]
    ]
  }
};

console.log('Workflow Connections:');
console.log(JSON.stringify(connections, null, 2));

console.log('\n📝 COMPLETE WORKFLOW JSON:');
const completeWorkflow = {
  "name": "Yellow Box Real-time Data Sync",
  "nodes": [webhookConfig, googleSheetsConfig],
  "connections": connections,
  "active": true,
  "settings": {
    "executionOrder": "v1"
  },
  "staticData": {},
  "tags": [],
  "triggerCount": 1,
  "updatedAt": new Date().toISOString(),
  "versionId": "1"
};

console.log(JSON.stringify(completeWorkflow, null, 2));

console.log('\n🛠️  CRITICAL CONFIGURATION POINTS:');
console.log('1. Webhook Trigger Node:');
console.log('   ✓ httpMethod: "POST"');
console.log('   ✓ path: "yellowbox-sync"');
console.log('   ✓ responseMode: "onReceived"');
console.log('   ✓ responseCode: 200');

console.log('\n2. Google Sheets Node:');
console.log('   ✓ operation: "appendOrUpdate"');
console.log('   ✓ documentId: YOUR_GOOGLE_SHEETS_ID');
console.log('   ✓ sheetName: "Expenses"');
console.log('   ✓ columns.matchingColumns[0].field: "id" ← CRITICAL FIX');

console.log('\n🔧 MANUAL CONFIGURATION STEPS:');
console.log('1. Replace YOUR_GOOGLE_SHEETS_ID_HERE with actual Google Sheets ID');
console.log('2. Replace YOUR_GOOGLE_SHEETS_CREDENTIAL_ID with credential ID');
console.log('3. Ensure Google Sheets has headers: id, riderId, riderName, amount, etc.');
console.log('4. Set up Google Sheets OAuth2 credentials');
console.log('5. Activate the workflow');

console.log('\n🧪 VALIDATION COMMANDS:');
console.log('After configuration:');
console.log('- Test webhook: node test-both-webhook-endpoints.js');
console.log('- Test complete flow: node test-complete-google-sheets-flow.js');

console.log('\n' + '=' .repeat(70));
console.log('🎯 KEY FIX: Set matchingColumns[0].field to "id" in Google Sheets node');
console.log('=' .repeat(70));