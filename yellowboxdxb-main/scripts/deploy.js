#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get environment from command line argument
const environment = process.argv[2] || 'development';
const validEnvironments = ['development', 'staging', 'production'];

if (!validEnvironments.includes(environment)) {
  console.error(`❌ Invalid environment: ${environment}`);
  console.error(`Valid environments: ${validEnvironments.join(', ')}`);
  process.exit(1);
}

console.log(`🚀 Starting deployment to ${environment}...`);

try {
  // Check if Firebase CLI is installed
  try {
    execSync('firebase --version', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Firebase CLI not found. Please install it with: npm install -g firebase-tools');
    process.exit(1);
  }

  // Check if user is logged in
  try {
    execSync('firebase projects:list', { stdio: 'ignore' });
  } catch (error) {
    console.error('❌ Not logged in to Firebase. Please run: firebase login');
    process.exit(1);
  }

  // Set the Firebase project
  console.log(`📋 Setting Firebase project to ${environment}...`);
  execSync(`firebase use ${environment}`, { stdio: 'inherit' });

  // Build the application
  console.log(`🔨 Building application for ${environment}...`);
  const buildCommand = environment === 'production' 
    ? 'npm run build:production'
    : environment === 'staging'
    ? 'npm run build:staging'
    : 'npm run build';
  
  execSync(buildCommand, { stdio: 'inherit' });

  // Check if dist directory exists
  if (!fs.existsSync(path.join(__dirname, '..', 'dist'))) {
    console.error('❌ Build failed - dist directory not found');
    process.exit(1);
  }

  // Deploy to Firebase Hosting
  console.log(`🚀 Deploying to Firebase Hosting...`);
  execSync('firebase deploy --only hosting', { stdio: 'inherit' });

  // Get the hosting URL
  const projectId = environment === 'production' ? 'yellowbox-8e0e6' : `yellowbox-${environment}`;
  const hostingUrl = `https://${projectId}.web.app`;

  console.log(`✅ Deployment successful!`);
  console.log(`🌐 Your app is live at: ${hostingUrl}`);
  
  // Optional: Open the URL in browser
  if (process.argv.includes('--open')) {
    const { exec } = require('child_process');
    exec(`open ${hostingUrl}`);
  }

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}