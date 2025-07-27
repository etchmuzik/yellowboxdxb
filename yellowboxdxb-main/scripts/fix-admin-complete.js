#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🔧 Starting complete admin user fix...');
console.log('⚠️  This will temporarily relax security rules to fix user profiles');

try {
  // Step 1: Deploy development rules to allow user profile creation
  console.log('\n💾 Step 1: Deploying development rules...');
  execSync('npm run deploy-dev-rules', { stdio: 'inherit' });
  
  // Step 2: Fix the user profiles
  console.log('\n👤 Step 2: Creating user profiles...');
  execSync('node scripts/fix-admin-user.js', { stdio: 'inherit' });
  
  // Step 3: Restore production rules
  console.log('\n🔒 Step 3: Restoring production rules...');
  execSync('npm run restore-rules', { stdio: 'inherit' });
  
  console.log('\n✅ Complete admin fix finished successfully!');
  console.log('🚀 Your admin user now has full permissions to add riders!');
  
} catch (error) {
  console.error('❌ Fix failed:', error.message);
  console.log('\n🔧 Attempting to restore production rules...');
  
  try {
    execSync('npm run restore-rules', { stdio: 'inherit' });
    console.log('✅ Production rules restored');
  } catch (restoreError) {
    console.error('❌ Failed to restore rules:', restoreError.message);
  }
  
  process.exit(1);
}