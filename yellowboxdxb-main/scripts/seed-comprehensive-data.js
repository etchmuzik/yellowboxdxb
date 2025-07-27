#!/usr/bin/env node
/**
 * Comprehensive Seed Data Script for Yellow Box
 * Creates realistic test data for all user roles and scenarios
 */

const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Initialize Firebase Admin
const app = initializeApp({
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET
});

const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

// Test data
const TEST_USERS = [
  {
    email: 'admin@yellowbox.ae',
    password: 'YellowBox2025!',
    name: 'Admin User',
    role: 'Admin',
    phone: '+971501234567'
  },
  {
    email: 'operations@yellowbox.ae',
    password: 'YellowBox2025!',
    name: 'Operations Manager',
    role: 'Operations',
    phone: '+971502345678'
  },
  {
    email: 'finance@yellowbox.ae',
    password: 'YellowBox2025!',
    name: 'Finance Manager',
    role: 'Finance',
    phone: '+971503456789'
  }
];

const RIDER_STAGES = [
  'Applied',
  'Documents Verified',
  'Theory Test',
  'Road Test',
  'Medical',
  'ID Issued',
  'Active'
];

const BIKE_MODELS = [
  'Honda PCX 150',
  'Yamaha NMAX 155',
  'Honda ADV 150',
  'Suzuki Burgman 125'
];

const EXPENSE_CATEGORIES = [
  'Visa Processing',
  'Medical Exam',
  'Theory Test',
  'Road Test',
  'Uniform',
  'Equipment',
  'Training',
  'ID Card'
];

// Generate random data helpers
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

async function createTestUsers() {
  console.log('👤 Creating test users...');
  
  for (const userData of TEST_USERS) {
    try {
      // Create Firebase Auth user
      const userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.name,
        emailVerified: true
      });

      // Set custom claims
      await auth.setCustomUserClaims(userRecord.uid, {
        role: userData.role
      });

      // Create Firestore user document
      await db.collection('users').doc(userRecord.uid).set({
        id: userRecord.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        phone: userData.phone,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastLogin: null,
        isActive: true
      });

      console.log(`✅ Created ${userData.role}: ${userData.email}`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`ℹ️  User ${userData.email} already exists`);
      } else {
        console.error(`❌ Error creating ${userData.email}:`, error);
      }
    }
  }
}

async function createRiders() {
  console.log('\n🏍️  Creating test riders...');
  
  const nationalities = ['India', 'Pakistan', 'Bangladesh', 'Philippines', 'Egypt'];
  const riders = [];
  
  for (let i = 1; i <= 50; i++) {
    const stage = randomElement(RIDER_STAGES);
    const isActive = stage === 'Active';
    
    const rider = {
      id: `rider_${i}`,
      fullName: `Test Rider ${i}`,
      email: `rider${i}@test.com`,
      phone: `+97150${randomNumber(1000000, 9999999)}`,
      nationality: randomElement(nationalities),
      emiratesId: `784-${randomNumber(1970, 2000)}-${randomNumber(1000000, 9999999)}-${randomNumber(1, 9)}`,
      bikeType: randomElement(BIKE_MODELS),
      applicationStage: stage,
      dateApplied: randomDate(new Date('2024-01-01'), new Date()),
      documentsVerified: ['Documents Verified', 'Theory Test', 'Road Test', 'Medical', 'ID Issued', 'Active'].includes(stage),
      theoryTestPassed: ['Theory Test', 'Road Test', 'Medical', 'ID Issued', 'Active'].includes(stage),
      roadTestPassed: ['Road Test', 'Medical', 'ID Issued', 'Active'].includes(stage),
      medicalPassed: ['Medical', 'ID Issued', 'Active'].includes(stage),
      idIssued: ['ID Issued', 'Active'].includes(stage),
      isActive,
      profilePhotoUrl: `https://ui-avatars.com/api/?name=Rider+${i}&background=random`,
      notes: `Test rider ${i} for development`,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    
    riders.push(rider);
    await db.collection('riders').doc(rider.id).set(rider);
  }
  
  console.log(`✅ Created ${riders.length} test riders`);
  return riders;
}

async function createExpenses(riders) {
  console.log('\n💰 Creating test expenses...');
  
  let expenseCount = 0;
  
  for (const rider of riders) {
    // Create 2-5 expenses per rider
    const numExpenses = randomNumber(2, 5);
    
    for (let i = 0; i < numExpenses; i++) {
      const expense = {
        id: `expense_${rider.id}_${i}`,
        riderId: rider.id,
        category: randomElement(EXPENSE_CATEGORIES),
        amountAed: randomNumber(50, 1000),
        date: randomDate(new Date('2024-01-01'), new Date()).toISOString(),
        description: `Test expense for ${rider.fullName}`,
        status: randomElement(['pending', 'approved', 'rejected']),
        receiptUrl: null,
        createdBy: rider.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
      
      // Add approval/rejection details
      if (expense.status === 'approved') {
        expense.approvedBy = 'finance_user_id';
        expense.approvedAt = FieldValue.serverTimestamp();
      } else if (expense.status === 'rejected') {
        expense.rejectedBy = 'finance_user_id';
        expense.rejectedAt = FieldValue.serverTimestamp();
        expense.rejectionReason = 'Missing receipt';
      }
      
      await db.collection('expenses').doc(expense.id).set(expense);
      expenseCount++;
    }
  }
  
  console.log(`✅ Created ${expenseCount} test expenses`);
}

async function createDocuments(riders) {
  console.log('\n📄 Creating test documents...');
  
  const documentTypes = [
    'Emirates ID',
    'Visa',
    'Driver License',
    'Medical Certificate',
    'Theory Test Certificate',
    'Road Test Certificate'
  ];
  
  let documentCount = 0;
  
  for (const rider of riders) {
    for (const docType of documentTypes) {
      // Only create documents based on rider stage
      if (shouldHaveDocument(rider.applicationStage, docType)) {
        const document = {
          id: `doc_${rider.id}_${docType.replace(/\s+/g, '_').toLowerCase()}`,
          riderId: rider.id,
          type: docType,
          fileName: `${docType.replace(/\s+/g, '_')}_${rider.id}.pdf`,
          fileUrl: `https://storage.googleapis.com/yellowbox-8e0e6.appspot.com/documents/${rider.id}/${docType}.pdf`,
          uploadDate: randomDate(new Date('2024-01-01'), new Date()),
          status: 'Valid',
          expiryDate: docType === 'Visa' || docType === 'Emirates ID' 
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() 
            : null,
          verifiedBy: 'operations_user_id',
          verifiedAt: FieldValue.serverTimestamp(),
          notes: `Test document for ${rider.fullName}`,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        };
        
        await db.collection('rider_documents').doc(document.id).set(document);
        documentCount++;
      }
    }
  }
  
  console.log(`✅ Created ${documentCount} test documents`);
}

function shouldHaveDocument(stage, docType) {
  const stageIndex = RIDER_STAGES.indexOf(stage);
  
  switch (docType) {
    case 'Emirates ID':
    case 'Visa':
    case 'Driver License':
      return stageIndex >= 1; // Documents Verified and above
    case 'Theory Test Certificate':
      return stageIndex >= 2; // Theory Test and above
    case 'Road Test Certificate':
      return stageIndex >= 3; // Road Test and above
    case 'Medical Certificate':
      return stageIndex >= 4; // Medical and above
    default:
      return false;
  }
}

async function createBikes(riders) {
  console.log('\n🏍️  Creating test bikes...');
  
  const bikes = [];
  const activeRiders = riders.filter(r => r.isActive);
  
  // Create bikes for active riders plus some extras
  for (let i = 1; i <= activeRiders.length + 10; i++) {
    const isAssigned = i <= activeRiders.length;
    const bike = {
      id: `bike_${i}`,
      model: randomElement(BIKE_MODELS),
      registrationNumber: `DXB-${randomNumber(10000, 99999)}`,
      year: randomNumber(2020, 2024),
      status: isAssigned ? 'Assigned' : randomElement(['Available', 'Maintenance']),
      assignedTo: isAssigned ? activeRiders[i - 1].id : null,
      lastMaintenance: randomDate(new Date('2024-01-01'), new Date()),
      nextMaintenanceDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      mileage: randomNumber(1000, 50000),
      fuelLevel: randomNumber(20, 100),
      location: {
        latitude: 25.2048 + (Math.random() - 0.5) * 0.1,
        longitude: 55.2708 + (Math.random() - 0.5) * 0.1
      },
      notes: `Test bike ${i}`,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    
    bikes.push(bike);
    await db.collection('bikes').doc(bike.id).set(bike);
  }
  
  console.log(`✅ Created ${bikes.length} test bikes`);
  return bikes;
}

async function createBudgets() {
  console.log('\n💵 Creating test budgets...');
  
  const months = [];
  const now = new Date();
  
  // Create budgets for last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const budget = {
      id: `budget_${month}`,
      month,
      allocatedAed: randomNumber(50000, 100000),
      spentAed: randomNumber(30000, 80000),
      categories: {
        'Visa Processing': randomNumber(10000, 20000),
        'Medical Exam': randomNumber(5000, 10000),
        'Theory Test': randomNumber(3000, 6000),
        'Road Test': randomNumber(3000, 6000),
        'Uniform': randomNumber(5000, 10000),
        'Equipment': randomNumber(8000, 15000),
        'Training': randomNumber(5000, 10000),
        'ID Card': randomNumber(2000, 5000)
      },
      createdBy: 'finance_user_id',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    
    await db.collection('budgets').doc(budget.id).set(budget);
    months.push(month);
  }
  
  console.log(`✅ Created budgets for ${months.length} months`);
}

async function createNotifications() {
  console.log('\n🔔 Creating test notifications...');
  
  const notificationTypes = [
    { type: 'expense_approved', message: 'Your expense has been approved' },
    { type: 'expense_rejected', message: 'Your expense has been rejected' },
    { type: 'document_verified', message: 'Your document has been verified' },
    { type: 'bike_assigned', message: 'A bike has been assigned to you' },
    { type: 'maintenance_due', message: 'Your bike maintenance is due' }
  ];
  
  let notificationCount = 0;
  
  // Create some sample notifications
  for (let i = 0; i < 20; i++) {
    const notif = randomElement(notificationTypes);
    
    const notification = {
      id: `notif_${i}`,
      userId: `rider_${randomNumber(1, 50)}`,
      type: notif.type,
      title: notif.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      message: notif.message,
      read: Math.random() > 0.5,
      readAt: Math.random() > 0.5 ? FieldValue.serverTimestamp() : null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };
    
    await db.collection('notifications').doc(notification.id).set(notification);
    notificationCount++;
  }
  
  console.log(`✅ Created ${notificationCount} test notifications`);
}

async function main() {
  console.log('🚀 Starting Yellow Box comprehensive data seeding...\n');
  
  try {
    // Create users
    await createTestUsers();
    
    // Create riders
    const riders = await createRiders();
    
    // Create related data
    await createExpenses(riders);
    await createDocuments(riders);
    await createBikes(riders);
    await createBudgets();
    await createNotifications();
    
    console.log('\n✅ Data seeding completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Admin: admin@yellowbox.ae / YellowBox2025!');
    console.log('Operations: operations@yellowbox.ae / YellowBox2025!');
    console.log('Finance: finance@yellowbox.ae / YellowBox2025!');
    
    console.log('\n🔍 You can now:');
    console.log('1. Login with any of the test accounts');
    console.log('2. View riders in various stages');
    console.log('3. Approve/reject expenses');
    console.log('4. Track bikes on the map');
    console.log('5. Verify documents');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the seeding
main();