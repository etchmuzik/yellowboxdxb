#!/bin/bash

echo "🌐 DNS VERIFICATION FOR www.yellowboxdxb.com"
echo "=============================================="
echo ""

echo "1. Checking current CNAME record..."
echo "-----------------------------------"
nslookup www.yellowboxdxb.com
echo ""

echo "2. Expected CNAME target: yellowbox-8e0e6.web.app"
echo "3. Current DNS status:"
echo ""

# Check if CNAME points to correct target
CURRENT_CNAME=$(dig +short www.yellowboxdxb.com CNAME)
EXPECTED_TARGET="yellowbox-8e0e6.web.app"

if [[ "$CURRENT_CNAME" == *"$EXPECTED_TARGET"* ]]; then
    echo "✅ CNAME record is CORRECT: $CURRENT_CNAME"
else
    echo "❌ CNAME record needs updating:"
    echo "   Current: $CURRENT_CNAME"
    echo "   Expected: $EXPECTED_TARGET"
fi

echo ""
echo "4. Testing domain accessibility..."
echo "--------------------------------"

# Test HTTP access
if curl -s -o /dev/null -w "%{http_code}" http://www.yellowboxdxb.com | grep -q "200\|301\|302"; then
    echo "✅ HTTP access: Working"
else
    echo "❌ HTTP access: Not working"
fi

# Test HTTPS access
if curl -s -o /dev/null -w "%{http_code}" https://www.yellowboxdxb.com | grep -q "200\|301\|302"; then
    echo "✅ HTTPS access: Working"
else
    echo "❌ HTTPS access: Not working (SSL may be pending)"
fi

echo ""
echo "5. DNS Propagation Check:"
echo "------------------------"
echo "Use these online tools to verify global propagation:"
echo "• https://dnschecker.org/"
echo "• https://www.whatsmydns.net/"
echo "• Search for: www.yellowboxdxb.com (CNAME)"
echo ""

echo "6. Required DNS Changes:"
echo "-----------------------"
echo "ADD this CNAME record:"
echo "  Type: CNAME"
echo "  Name: www"
echo "  Value: yellowbox-8e0e6.web.app"
echo ""
echo "REMOVE this CNAME record:"
echo "  Type: CNAME"
echo "  Name: www"
echo "  Value: yellowboxdxb.com"
echo ""

echo "7. Firebase Hosting Status:"
echo "---------------------------"
echo "After DNS changes, check Firebase Console:"
echo "• Go to Hosting > Custom domains"
echo "• Status should show 'Connected'"
echo "• SSL certificate should be 'Active'"