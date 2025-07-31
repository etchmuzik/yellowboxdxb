#!/usr/bin/env node

/**
 * Script to assign the first Admin role to a user
 * This bypasses the setUserRole Cloud Function's role requirement
 * Usage: node scripts/assign-first-admin.js <userId>
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin SDK using Application Default Credentials
try {
  admin.initializeApp({
    projectId: 'yellowbox-8e0e6'
  });
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error.message);
  console.error('Make sure you are logged in with Firebase CLI: firebase login');
  process.exit(1);
}

async function assignFirstAdmin(userId) {
  try {
    console.log(`Attempting to assign Admin role to user: ${userId}`);
    
    // Get user info first
    const userRecord = await admin.auth().getUser(userId);
    console.log(`User found: ${userRecord.email} (${userRecord.displayName})`);
    
    // Set custom claims
    await admin.auth().setCustomUserClaims(userId, { role: 'Admin' });
    
    console.log(`✅ SUCCESS! User ${userId} (${userRecord.email}) has been assigned Admin role.`);
    console.log('\nNext steps:');
    console.log('1. The user should log out and log back in to refresh their token');
    console.log('2. They can now use the setUserRole Cloud Function to assign roles to other users');
    console.log('3. After all roles are assigned, disable bootstrap mode for security');
    
  } catch (error) {
    console.error('❌ Error assigning Admin role:', error.message);
    process.exit(1);
  }
}

// Get userId from command line arguments
const userId = process.argv[2];
if (!userId) {
  console.error('Usage: node scripts/assign-first-admin.js <userId>');
  console.error('To get a userId, check the Firebase Auth console or use the listUsers script');
  process.exit(1);
}

assignFirstAdmin(userId);