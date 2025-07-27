#!/usr/bin/env node

/**
 * Standalone seed script for Yellow Box Firebase
 * This script loads environment variables and seeds the database with sample data
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please ensure your .env file contains all required Firebase configuration.');
  process.exit(1);
}

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Sample data
const sampleRiders = [
  {
    fullName: 'Ahmed Hassan',
    nationality: 'Egyptian',
    phone: '+971501234567',
    email: 'ahmed.hassan@example.com',
    bikeType: 'Honda PCX 150',
    visaNumber: 'VIS-2024-001',
    applicationStage: 'Docs Verified',
    testStatus: {
      theory: 'Pending',
      road: 'Pending',
      medical: 'Pass'
    },
    joinDate: '2025-06-01',
    expectedStart: '2025-07-01',
    notes: 'Strong candidate, previous delivery experience',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    fullName: 'Mohammed Ali',
    nationality: 'Pakistani',
    phone: '+971502345678',
    email: 'mohammed.ali@example.com',
    bikeType: 'Yamaha NMAX',
    visaNumber: 'VIS-2024-002',
    applicationStage: 'Theory Test',
    testStatus: {
      theory: 'Pass',
      road: 'Pass',
      medical: 'Pass'
    },
    joinDate: '2025-05-15',
    expectedStart: '2025-06-15',
    notes: 'Completed all tests, starting training',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    fullName: 'Rajesh Kumar',
    nationality: 'Indian',
    phone: '+971503456789',
    email: 'rajesh.kumar@example.com',
    bikeType: 'Honda PCX 150',
    visaNumber: 'VIS-2024-003',
    applicationStage: 'Active',
    testStatus: {
      theory: 'Pass',
      road: 'Pass',
      medical: 'Pass'
    },
    joinDate: '2025-04-01',
    expectedStart: '2025-04-15',
    notes: 'Active rider, excellent performance',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const sampleExpenses = [
  {
    category: 'Visa Fees',
    amountAed: 2500,
    date: '2025-06-01',
    description: 'UAE residence visa application fee',
    status: 'Approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    category: 'Medical',
    amountAed: 350,
    date: '2025-06-05',
    description: 'Medical fitness test for visa',
    status: 'Approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    category: 'RTA Tests',
    amountAed: 400,
    date: '2025-06-10',
    description: 'RTA theory test fee',
    status: 'Pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    category: 'Uniform',
    amountAed: 250,
    date: '2025-06-15',
    description: 'Yellow Box branded uniform set',
    status: 'Approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function seedDatabase() {
  try {
    console.log('🚀 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase initialized successfully');
    console.log('📊 Seeding database with sample data...');

    // Add riders
    const riderIds = [];
    console.log('👥 Adding sample riders...');
    
    for (const rider of sampleRiders) {
      const docRef = await addDoc(collection(db, 'riders'), rider);
      riderIds.push(docRef.id);
      console.log(`✅ Added rider: ${rider.fullName} (ID: ${docRef.id})`);
    }

    // Add expenses (assign to random riders)
    console.log('💰 Adding sample expenses...');
    
    for (const expense of sampleExpenses) {
      const randomRiderId = riderIds[Math.floor(Math.random() * riderIds.length)];
      await addDoc(collection(db, 'expenses'), {
        ...expense,
        riderId: randomRiderId
      });
      console.log(`✅ Added expense: ${expense.description} (AED ${expense.amountAed})`);
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log(`📈 Added ${sampleRiders.length} riders and ${sampleExpenses.length} expenses`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed script
seedDatabase();

export { seedDatabase };