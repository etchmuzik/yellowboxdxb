#!/usr/bin/env node

/**
 * Restore production Firestore rules after seeding
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

console.log('🔒 Restoring production Firestore rules...');

try {
  // Check if backup exists
  if (!existsSync('firestore.rules.backup')) {
    console.error('❌ No backup rules found (firestore.rules.backup)');
    console.log('ℹ️  Manually restore your production rules');
    process.exit(1);
  }

  // Restore backup rules
  console.log('🔄 Restoring backup rules...');
  execSync('cp firestore.rules.backup firestore.rules');

  // Deploy the restored rules
  console.log('🚀 Deploying production rules...');
  execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });

  // Clean up backup file
  console.log('🧹 Cleaning up backup file...');
  execSync('rm firestore.rules.backup');

  console.log('✅ Production rules restored successfully!');
  console.log('🔒 Database is now properly secured');

} catch (error) {
  console.error('❌ Failed to restore production rules:', error.message);
  process.exit(1);
}