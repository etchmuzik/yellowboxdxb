#!/bin/bash

# Yellow Box n8n Workflow Fix Test Script
# This script tests the fixed n8n workflow

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Webhook URL
WEBHOOK_URL="https://n8n.srv924607.hstgr.cloud/webhook/yellowbox-sync"

echo -e "${BLUE}=== Yellow Box n8n Workflow Fix Test ===${NC}"
echo -e "${YELLOW}Testing webhook endpoint: $WEBHOOK_URL${NC}"
echo ""

# Function to test webhook
test_webhook() {
    local test_type=$1
    local test_name=$2
    local payload=$3
    
    echo -e "${BLUE}Testing: $test_name${NC}"
    echo -e "${YELLOW}Payload type: $test_type${NC}"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$payload")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ Success: HTTP $http_code${NC}"
        echo -e "${GREEN}Response: $body${NC}"
    else
        echo -e "${RED}✗ Failed: HTTP $http_code${NC}"
        echo -e "${RED}Response: $body${NC}"
    fi
    echo ""
}

# Test 1: Rider Creation
echo -e "${YELLOW}Test 1: Rider Creation${NC}"
rider_payload='{
  "type": "rider",
  "action": "create",
  "id": "test_rider_fix_'$(date +%s)'",
  "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
  "data": {
    "id": "test_rider_fix_'$(date +%s)'",
    "fullName": "Test Rider Fixed",
    "email": "testfixed'$(date +%s)'@yellowbox.ae",
    "phone": "+971501234567",
    "nationality": "UAE",
    "visaNumber": "TEST123456",
    "applicationStage": "active",
    "bikeType": "Standard",
    "assignedBikeId": "BIKE001",
    "testStatus": {
      "theory": "passed",
      "road": "passed",
      "medical": "passed"
    },
    "joinDate": "'$(date -u +"%Y-%m-%d")'",
    "notes": "Test rider created after workflow fix"
  }
}'

test_webhook "rider" "Rider Creation" "$rider_payload"

# Test 2: Expense Submission
echo -e "${YELLOW}Test 2: Expense Submission${NC}"
expense_payload='{
  "type": "expense",
  "action": "create",
  "id": "test_expense_fix_'$(date +%s)'",
  "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
  "data": {
    "riderId": "test_rider_fix_001",
    "riderName": "Test Rider Fixed",
    "category": "fuel",
    "amountAed": 150.50,
    "date": "'$(date -u +"%Y-%m-%d")'",
    "description": "Fuel expense test after fix",
    "status": "pending",
    "receiptUrl": "https://example.com/receipt.jpg"
  }
}'

test_webhook "expense" "Expense Submission" "$expense_payload"

# Test 3: Document Upload
echo -e "${YELLOW}Test 3: Document Upload${NC}"
document_payload='{
  "type": "document",
  "action": "create",
  "id": "test_document_fix_'$(date +%s)'",
  "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
  "data": {
    "riderId": "test_rider_fix_001",
    "type": "emirates_id",
    "fileName": "emirates_id_test.pdf",
    "fileUrl": "https://example.com/documents/emirates_id.pdf",
    "uploadDate": "'$(date -u +"%Y-%m-%d")'",
    "expiryDate": "2025-12-31",
    "status": "verified",
    "notes": "Test document after workflow fix"
  }
}'

test_webhook "document" "Document Upload" "$document_payload"

# Test 4: Simple Test
echo -e "${YELLOW}Test 4: Simple Test${NC}"
test_payload='{
  "type": "test",
  "action": "test",
  "id": "simple_test_'$(date +%s)'",
  "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
  "data": {
    "message": "Testing workflow after fixes"
  }
}'

test_webhook "test" "Simple Test" "$test_payload"

echo -e "${BLUE}=== Test Summary ===${NC}"
echo -e "${YELLOW}All tests completed!${NC}"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Check n8n execution history: https://n8n.srv924607.hstgr.cloud/"
echo "2. Verify data in Google Sheets:"
echo "   - Riders: https://docs.google.com/spreadsheets/d/1vAHRvoB3PCsr66Z0uT6M_4LgK3B1acIdUun_zl8GFx8"
echo "   - Expenses: https://docs.google.com/spreadsheets/d/1hXBqOtrtLd2w4_vciMoJsOgPZNFx-T8qSiE7hSqqkyA"
echo "3. Look for the test data with timestamps matching this test run"
echo ""
echo -e "${YELLOW}Make sure the workflow is ACTIVE before running tests!${NC}"