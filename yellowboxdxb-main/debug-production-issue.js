#!/usr/bin/env node

import fetch from 'node-fetch';

console.log('🔍 DEBUGGING PRODUCTION ISSUE');
console.log('==============================\n');

async function debugProductionIssue() {
  try {
    console.log('1. Testing production app accessibility...');
    
    // Test if the main page loads
    const mainResponse = await fetch('https://yellowboxdxb.web.app/');
    console.log(`Main page status: ${mainResponse.status}`);
    
    // Test if the riders page loads
    const ridersResponse = await fetch('https://yellowboxdxb.web.app/riders');
    console.log(`Riders page status: ${ridersResponse.status}`);
    
    if (ridersResponse.status === 200) {
      const html = await ridersResponse.text();
      
      // Check if it's redirecting to login
      if (html.includes('login') || html.includes('Login')) {
        console.log('❌ App is redirecting to login page');
        console.log('   This means authentication is still required');
      } else {
        console.log('✅ Riders page loads without redirect');
      }
      
      // Check if Firebase config is present
      if (html.includes('firebase')) {
        console.log('✅ Firebase configuration found in HTML');
      } else {
        console.log('❌ Firebase configuration missing');
      }
    }

    console.log('\n2. Possible issues:');
    console.log('- Authentication still required in production');
    console.log('- Firebase rules blocking access');
    console.log('- JavaScript errors preventing data loading');
    console.log('- Environment variables not set correctly');

    console.log('\n3. Debugging steps:');
    console.log('- Open browser dev tools at https://yellowboxdxb.web.app/riders');
    console.log('- Check Console tab for JavaScript errors');
    console.log('- Check Network tab for failed requests');
    console.log('- Try the debug page: https://yellowboxdxb.web.app/riders-debug');

  } catch (error) {
    console.error('❌ Error debugging production:', error.message);
  }
}

debugProductionIssue();