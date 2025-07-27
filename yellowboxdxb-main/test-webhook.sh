#!/bin/bash

# Yellow Box n8n Webhook Test Script
# This script tests the real-time data sync webhook endpoint

echo "🧪 Testing Yellow Box n8n Webhook Endpoints"
echo "============================================="

# Test data for rider sync
RIDER_DATA='{
  "type": "rider",
  "action": "create",
  "data": {
    "id": "test-rider-123",
    "name": "Test Rider",
    "email": "test@yellowbox.ae",
    "phone": "+971501234567",
    "status": "applied",
    "visaNumber": "TEST123456",
    "licenseNumber": "",
    "createdAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'",
    "updatedAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'"
  }
}'

# Test data for expense sync
EXPENSE_DATA='{
  "type": "expense",
  "action": "create", 
  "data": {
    "id": "test-expense-456",
    "riderId": "test-rider-123",
    "amount": 150.00,
    "category": "Visa Fees",
    "description": "Test expense for webhook",
    "receiptUrl": "https://example.com/receipt.jpg",
    "status": "pending",
    "createdAt": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'",
    "approvedAt": null
  }
}'

# Webhook endpoint
WEBHOOK_URL="http://localhost:5678/webhook/yellowbox-sync"

echo "📡 Testing Rider Data Sync..."
echo "Endpoint: $WEBHOOK_URL"
echo "Payload: $RIDER_DATA"
echo ""

# Test rider sync
RIDER_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$RIDER_DATA" \
  "$WEBHOOK_URL")

RIDER_HTTP_STATUS=$(echo "$RIDER_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
RIDER_BODY=$(echo "$RIDER_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "Response Status: $RIDER_HTTP_STATUS"
echo "Response Body: $RIDER_BODY"
echo ""

if [ "$RIDER_HTTP_STATUS" = "200" ]; then
    echo "✅ Rider sync test: PASSED"
else
    echo "❌ Rider sync test: FAILED (Status: $RIDER_HTTP_STATUS)"
fi

echo ""
echo "📡 Testing Expense Data Sync..."
echo "Payload: $EXPENSE_DATA"
echo ""

# Test expense sync
EXPENSE_RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d "$EXPENSE_DATA" \
  "$WEBHOOK_URL")

EXPENSE_HTTP_STATUS=$(echo "$EXPENSE_RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
EXPENSE_BODY=$(echo "$EXPENSE_RESPONSE" | sed '/HTTP_STATUS:/d')

echo "Response Status: $EXPENSE_HTTP_STATUS"
echo "Response Body: $EXPENSE_BODY"
echo ""

if [ "$EXPENSE_HTTP_STATUS" = "200" ]; then
    echo "✅ Expense sync test: PASSED"
else
    echo "❌ Expense sync test: FAILED (Status: $EXPENSE_HTTP_STATUS)"
fi

echo ""
echo "🔍 Testing n8n Health..."
N8N_HEALTH=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "http://localhost:5678/healthz")
N8N_STATUS=$(echo "$N8N_HEALTH" | grep "HTTP_STATUS:" | cut -d: -f2)

if [ "$N8N_STATUS" = "200" ]; then
    echo "✅ n8n instance: HEALTHY"
else
    echo "❌ n8n instance: UNHEALTHY (Status: $N8N_STATUS)"
fi

echo ""
echo "📋 Summary:"
echo "==========="
echo "n8n Instance: $([ "$N8N_STATUS" = "200" ] && echo "✅ Running" || echo "❌ Not responding")"
echo "Rider Sync: $([ "$RIDER_HTTP_STATUS" = "200" ] && echo "✅ Working" || echo "❌ Failed")"
echo "Expense Sync: $([ "$EXPENSE_HTTP_STATUS" = "200" ] && echo "✅ Working" || echo "❌ Failed")"
echo ""
echo "💡 Next Steps:"
echo "1. Configure credentials in n8n (Google Sheets, EmailJS)"
echo "2. Run: ./configure-workflows.sh"
echo "3. Check Google Sheets for synced data"
echo "4. Activate workflows in n8n interface"
echo ""
echo "🌐 n8n Interface: http://localhost:5678"