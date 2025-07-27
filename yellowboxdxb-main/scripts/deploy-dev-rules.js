#!/usr/bin/env node

/**
 * Deploy development Firestore rules temporarily for seeding
 * ⚠️ WARNING: This makes the database completely open - use only for development seeding
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🚨 WARNING: Deploying OPEN development rules for seeding');
console.log('⚠️  This makes your database completely public temporarily');
console.log('🔒 Remember to restore production rules after seeding!');
console.log('');

try {
  // Check if Firebase CLI is available
  execSync('firebase --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Firebase CLI not found. Install it with: npm install -g firebase-tools');
  process.exit(1);
}

try {
  // Check if dev rules exist
  if (!existsSync('firestore.rules.dev')) {
    console.error('❌ firestore.rules.dev not found');
    process.exit(1);
  }

  // Backup current rules
  console.log('💾 Backing up current rules...');
  execSync('cp firestore.rules firestore.rules.backup');

  // Copy dev rules to main rules file
  console.log('🔓 Deploying development rules...');
  execSync('cp firestore.rules.dev firestore.rules');

  // Deploy the rules
  console.log('🚀 Deploying to Firebase...');
  execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });

  console.log('✅ Development rules deployed successfully!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Run: npm run seed');
  console.log('2. Run: npm run restore-rules');
  console.log('');

} catch (error) {
  console.error('❌ Failed to deploy development rules:', error.message);
  
  // Try to restore backup if it exists
  if (existsSync('firestore.rules.backup')) {
    console.log('🔄 Restoring backup rules...');
    execSync('cp firestore.rules.backup firestore.rules');
  }
  
  process.exit(1);
}