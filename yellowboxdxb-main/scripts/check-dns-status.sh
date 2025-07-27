#!/bin/bash

echo "🌐 DNS Status Check for yellowboxdxb.com"
echo "========================================"

# Check if the old A record is still present
echo "🔍 Checking for old A record (185.158.133.1)..."
OLD_RECORD=$(dig +short yellowboxdxb.com A | grep "185.158.133.1")

if [ -z "$OLD_RECORD" ]; then
    echo "✅ Old A record (185.158.133.1) has been removed"
    echo "🎉 Domain is ready for Firebase verification!"
else
    echo "❌ Old A record still present: $OLD_RECORD"
    echo "⏳ Please remove the A record and wait for DNS propagation"
fi

echo ""
echo "📋 Current DNS Records:"
dig yellowboxdxb.com A +short

echo ""
echo "🌍 Checking DNS propagation across different servers:"
echo "Google DNS (8.8.8.8):"
dig @8.8.8.8 yellowboxdxb.com A +short

echo "Cloudflare DNS (1.1.1.1):"
dig @1.1.1.1 yellowboxdxb.com A +short

echo "OpenDNS (208.67.222.222):"
dig @208.67.222.222 yellowboxdxb.com A +short

echo ""
echo "🔗 Useful Links:"
echo "- DNS Propagation Checker: https://dnschecker.org"
echo "- Firebase Console: https://console.firebase.google.com/project/yellowbox-8e0e6/hosting/main"
echo ""
echo "📝 Next Steps:"
if [ -z "$OLD_RECORD" ]; then
    echo "1. Go to Firebase Console and click 'Verify' for yellowboxdxb.com"
    echo "2. Add the Firebase-provided A records to your DNS"
    echo "3. Wait for SSL certificate provisioning (24-48 hours)"
else
    echo "1. Remove the A record (185.158.133.1) from your DNS provider"
    echo "2. Wait 5-10 minutes and run this script again"
    echo "3. Once removed, verify domain in Firebase Console"
fi