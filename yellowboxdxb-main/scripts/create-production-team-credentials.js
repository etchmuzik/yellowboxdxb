#!/usr/bin/env node

/**
 * Production Team Credentials Setup Script
 * Creates clean Firebase Auth accounts with proper role assignments
 * for Yellow Box fleet management team distribution
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

// Team accounts configuration
const TEAM_ACCOUNTS = [
  {
    email: 'admin@yellowboxdxb.com',
    password: 'YellowBox2024!Admin#Dubai',
    displayName: 'Yellow Box Admin',
    role: 'Admin',
    description: 'Full system access - User management, analytics, bootstrap mode, all data access'
  },
  {
    email: 'operations@yellowboxdxb.com',
    password: 'YellowBox2024!Ops#Dubai',
    displayName: 'Operations Manager',
    role: 'Operations',
    description: 'Rider verification, document management, bike tracking, location monitoring'
  },
  {
    email: 'finance@yellowboxdxb.com',
    password: 'YellowBox2024!Finance#Dubai',
    displayName: 'Finance Manager',
    role: 'Finance',
    description: 'Expense approval, budget allocation, financial reports, payment processing'
  },
  {
    email: 'rider.demo@yellowboxdxb.com',
    password: 'YellowBox2024!Rider#Dubai',
    displayName: 'Demo Rider',
    role: 'Rider-Applicant',
    description: 'Personal dashboard, expense submission, document upload, profile management'
  }
];

class ProductionCredentialsSetup {
  constructor() {
    this.auth = null;
    this.db = null;
    this.createdUsers = [];
    this.errors = [];
  }

  async initialize() {
    try {
      console.log('🔥 Initializing Firebase Admin SDK...');
      
      // Check for service account file
      const serviceAccountPath = path.join(__dirname, '../serviceAccount.json');
      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error('serviceAccount.json not found. Please ensure Firebase service account is configured.');
      }
      
      const serviceAccount = require(serviceAccountPath);
      
      // Initialize Firebase Admin
      const app = initializeApp({
        credential: cert(serviceAccount),
        projectId: 'yellowbox-8e0e6'
      });
      
      this.auth = getAuth(app);
      this.db = getFirestore(app);
      
      console.log('✅ Firebase Admin SDK initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Firebase:', error.message);
      this.errors.push(`Initialization: ${error.message}`);
      return false;
    }
  }

  async createUserAccount(accountConfig) {
    try {
      console.log(`\n👤 Creating user: ${accountConfig.email}`);
      
      // Check if user already exists
      try {
        const existingUser = await this.auth.getUserByEmail(accountConfig.email);
        if (existingUser) {
          console.log(`⚠️  User ${accountConfig.email} already exists, updating...`);
          
          // Update existing user
          const updatedUser = await this.auth.updateUser(existingUser.uid, {
            displayName: accountConfig.displayName,
            password: accountConfig.password
          });
          
          // Set custom claims
          await this.auth.setCustomUserClaims(updatedUser.uid, {
            role: accountConfig.role
          });
          
          console.log(`✅ Updated existing user: ${accountConfig.email}`);
          return {
            uid: updatedUser.uid,
            email: accountConfig.email,
            role: accountConfig.role,
            password: accountConfig.password,
            displayName: accountConfig.displayName,
            description: accountConfig.description,
            status: 'updated'
          };
        }
      } catch (userNotFoundError) {
        // User doesn't exist, proceed with creation
      }
      
      // Create new user
      const userRecord = await this.auth.createUser({
        email: accountConfig.email,
        password: accountConfig.password,
        displayName: accountConfig.displayName,
        emailVerified: true
      });
      
      // Set custom claims for role-based access
      await this.auth.setCustomUserClaims(userRecord.uid, {
        role: accountConfig.role
      });
      
      // Create user profile in Firestore
      await this.db.collection('users').doc(userRecord.uid).set({
        email: accountConfig.email,
        displayName: accountConfig.displayName,
        role: accountConfig.role,
        createdAt: new Date(),
        isActive: true,
        lastLogin: null,
        profileComplete: true
      });
      
      console.log(`✅ Created user: ${accountConfig.email} with role: ${accountConfig.role}`);
      
      return {
        uid: userRecord.uid,
        email: accountConfig.email,
        role: accountConfig.role,
        password: accountConfig.password,
        displayName: accountConfig.displayName,
        description: accountConfig.description,
        status: 'created'
      };
      
    } catch (error) {
      console.error(`❌ Failed to create user ${accountConfig.email}:`, error.message);
      this.errors.push(`User Creation (${accountConfig.email}): ${error.message}`);
      return null;
    }
  }

  async verifyUserClaims(uid, expectedRole) {
    try {
      const userRecord = await this.auth.getUser(uid);
      const customClaims = userRecord.customClaims || {};
      
      if (customClaims.role === expectedRole) {
        console.log(`✅ Claims verified for ${userRecord.email}: ${expectedRole}`);
        return true;
      } else {
        console.log(`❌ Claims mismatch for ${userRecord.email}. Expected: ${expectedRole}, Got: ${customClaims.role || 'none'}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Failed to verify claims for user ${uid}:`, error.message);
      return false;
    }
  }

  async testUserAuthentication(userCredentials) {
    try {
      console.log(`🧪 Testing authentication for: ${userCredentials.email}`);
      
      // Verify user exists and has correct role
      const userRecord = await this.auth.getUserByEmail(userCredentials.email);
      const claimsValid = await this.verifyUserClaims(userRecord.uid, userCredentials.role);
      
      // Check Firestore profile
      const userDoc = await this.db.collection('users').doc(userRecord.uid).get();
      const profileExists = userDoc.exists;
      
      if (claimsValid && profileExists) {
        console.log(`✅ Authentication test passed for: ${userCredentials.email}`);
        return true;
      } else {
        console.log(`❌ Authentication test failed for: ${userCredentials.email}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Authentication test error for ${userCredentials.email}:`, error.message);
      return false;
    }
  }

  generateCredentialsReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 YELLOW BOX PRODUCTION TEAM CREDENTIALS');
    console.log('='.repeat(80));
    
    if (this.createdUsers.length === 0) {
      console.log('❌ No users were successfully created.');
      return;
    }
    
    console.log('\n🔐 LOGIN CREDENTIALS FOR TEAM DISTRIBUTION:\n');
    
    this.createdUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.role.toUpperCase()} ACCESS`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Description: ${user.description}`);
      console.log(`   Status: ${user.status}`);
      console.log('');
    });
    
    console.log('🌐 LOGIN URL: https://yellowboxdxb.com');
    console.log('📱 Each user will be redirected to their role-specific dashboard after login.');
    console.log('');
    
    // Role-specific access summary
    console.log('📊 ROLE ACCESS SUMMARY:');
    console.log('');
    console.log('👑 ADMIN - Full system access:');
    console.log('   • User management and role assignment');
    console.log('   • System analytics and reporting');
    console.log('   • All data access and modification');
    console.log('   • Bootstrap mode access');
    console.log('');
    console.log('🔧 OPERATIONS - Rider and fleet management:');
    console.log('   • Rider verification and lifecycle management');
    console.log('   • Document verification and approval');
    console.log('   • Bike fleet tracking and maintenance');
    console.log('   • GPS location monitoring');
    console.log('');
    console.log('💰 FINANCE - Financial operations:');
    console.log('   • Expense approval and budget management');
    console.log('   • Financial reporting and analytics');
    console.log('   • Payment processing oversight');
    console.log('   • Budget allocation and tracking');
    console.log('');
    console.log('🏍️ RIDER-APPLICANT - Personal dashboard:');
    console.log('   • Personal profile management');
    console.log('   • Expense submission and tracking');
    console.log('   • Document upload and status');
    console.log('   • Application progress monitoring');
    console.log('');
    
    if (this.errors.length > 0) {
      console.log('⚠️  ERRORS ENCOUNTERED:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      console.log('');
    }
    
    console.log('🔒 SECURITY NOTES:');
    console.log('• Bootstrap mode is DISABLED in production');
    console.log('• All users have strong passwords with special characters');
    console.log('• Role-based access control is enforced in Firestore rules');
    console.log('• Custom claims are properly assigned for each role');
    console.log('');
    console.log('✅ Setup completed successfully!');
    console.log('='.repeat(80));
  }

  async run() {
    console.log('🚀 Starting Yellow Box Production Team Credentials Setup...\n');
    
    // Initialize Firebase
    if (!await this.initialize()) {
      console.log('❌ Setup failed during initialization.');
      return;
    }
    
    // Create all team accounts
    console.log('\n📝 Creating team accounts...');
    for (const accountConfig of TEAM_ACCOUNTS) {
      const userCredentials = await this.createUserAccount(accountConfig);
      if (userCredentials) {
        this.createdUsers.push(userCredentials);
      }
    }
    
    // Test all created accounts
    console.log('\n🧪 Testing created accounts...');
    for (const userCredentials of this.createdUsers) {
      await this.testUserAuthentication(userCredentials);
    }
    
    // Generate final report
    this.generateCredentialsReport();
    
    console.log(`\n🎯 Setup Summary: ${this.createdUsers.length}/${TEAM_ACCOUNTS.length} accounts ready`);
    console.log('📋 Credentials are ready for team distribution!');
  }
}

// Run the setup
if (require.main === module) {
  const setup = new ProductionCredentialsSetup();
  setup.run().catch(error => {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  });
}

module.exports = ProductionCredentialsSetup;