#!/usr/bin/env node

/**
 * Script to list all Firebase Auth users
 * Helps identify which user should be assigned the first Admin role
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(
  readFileSync('./firebase-service-account.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'yellowbox-8e0e6'
});

async function listUsers() {
  try {
    console.log('Fetching all Firebase Auth users...\n');
    
    const listUsersResult = await admin.auth().listUsers();
    
    if (listUsersResult.users.length === 0) {
      console.log('No users found in Firebase Auth.');
      return;
    }
    
    console.log(`Found ${listUsersResult.users.length} user(s):\n`);
    
    for (const user of listUsersResult.users) {
      console.log(`🔹 User ID: ${user.uid}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Display Name: ${user.displayName || 'N/A'}`);
      console.log(`   Created: ${new Date(user.metadata.creationTime).toLocaleString()}`);
      console.log(`   Last Sign In: ${user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : 'Never'}`);
      
      // Check for existing custom claims
      if (user.customClaims && user.customClaims.role) {
        console.log(`   ✅ Current Role: ${user.customClaims.role}`);
      } else {
        console.log(`   ❌ No Role Assigned`);
      }
      console.log('');
    }
    
    console.log('To assign Admin role to a user, run:');
    console.log('node scripts/assign-first-admin.js <userId>');
    
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
    process.exit(1);
  }
}

listUsers();