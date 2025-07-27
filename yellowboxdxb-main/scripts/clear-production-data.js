#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🚀 Starting complete production data cleanup...');
console.log('⚠️  This will remove ALL test/dummy data from production!');

try {
  // Step 1: Deploy development rules to allow cleanup
  console.log('\n💾 Step 1: Deploying development rules...');
  execSync('npm run deploy-dev-rules', { stdio: 'inherit' });
  
  // Step 2: Clear the test data
  console.log('\n🧹 Step 2: Clearing test data...');
  execSync('node scripts/clear-test-data-safe.js', { stdio: 'inherit' });
  
  // Step 3: Restore production rules
  console.log('\n🔒 Step 3: Restoring production rules...');
  execSync('npm run restore-rules', { stdio: 'inherit' });
  
  console.log('\n✅ Complete cleanup finished successfully!');
  console.log('🚀 Your Yellow Box system is now ready for real data entry!');
  
} catch (error) {
  console.error('❌ Cleanup failed:', error.message);
  console.log('\n🔧 Attempting to restore production rules...');
  
  try {
    execSync('npm run restore-rules', { stdio: 'inherit' });
    console.log('✅ Production rules restored');
  } catch (restoreError) {
    console.error('❌ Failed to restore rules:', restoreError.message);
  }
  
  process.exit(1);
}