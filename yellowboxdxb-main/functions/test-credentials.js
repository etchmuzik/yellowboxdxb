#!/usr/bin/env node

/**
 * Test script to verify login credentials work
 */

const admin = require('firebase-admin');

// Team accounts to test
const TEST_ACCOUNTS = [
  { email: 'admin@yellowboxdxb.com', role: 'Admin' },
  { email: 'operations@yellowboxdxb.com', role: 'Operations' },
  { email: 'finance@yellowboxdxb.com', role: 'Finance' },
  { email: 'rider.demo@yellowboxdxb.com', role: 'Rider-Applicant' }
];

async function testCredentials() {
  try {
    console.log('🔍 Testing login credentials...\n');
    
    // Initialize Firebase Admin
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'yellowbox-8e0e6'
      });
    }
    
    const auth = admin.auth();
    const db = admin.firestore();
    
    for (const account of TEST_ACCOUNTS) {
      try {
        console.log(`👤 Checking ${account.email}...`);
        
        // Check if user exists in Auth
        const userRecord = await auth.getUserByEmail(account.email);
        console.log(`  ✅ User exists in Auth (UID: ${userRecord.uid})`);
        
        // Check custom claims
        const customClaims = userRecord.customClaims || {};
        console.log(`  🏷️  Custom claims: ${JSON.stringify(customClaims)}`);
        
        // Check Firestore profile
        const userDoc = await db.collection('users').doc(userRecord.uid).get();
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log(`  📄 Firestore profile exists`);
          console.log(`  📋 Role: ${userData.role}`);
          console.log(`  �� Email: ${userData.email}`);
          console.log(`  👤 Name: ${userData.displayName}`);
        } else {
          console.log(`  ❌ No Firestore profile found`);
        }
        
        console.log('');
        
      } catch (error) {
        console.error(`  ❌ Error checking ${account.email}:`, error.message);
        console.log('');
      }
    }
    
    console.log('='.repeat(60));
    console.log('✅ Credential verification complete');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  }
}

testCredentials();