#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, Timestamp } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAy7LWZ6Ni0x2RiveXFEHaa6R0GYT63wVs",
  authDomain: "yellowbox-8e0e6.firebaseapp.com",
  projectId: "yellowbox-8e0e6",
  storageBucket: "yellowbox-8e0e6.firebasestorage.app",
  messagingSenderId: "47222199157",
  appId: "1:47222199157:web:7a5e3b808083be2d43393c"
};

console.log('🔥 FIREBASE CONNECTION TEST');
console.log('============================\n');

async function testFirebaseConnection() {
  try {
    // Initialize Firebase
    console.log('1. Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('✅ Firebase initialized successfully');

    // Test reading riders collection
    console.log('\n2. Testing riders collection read...');
    const ridersRef = collection(db, 'riders');
    const ridersSnapshot = await getDocs(ridersRef);
    console.log(`✅ Riders collection accessible - Found ${ridersSnapshot.size} riders`);
    
    ridersSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`   - ${data.fullName || data.name || 'Unknown'} (${doc.id})`);
    });

    // Test reading expenses collection
    console.log('\n3. Testing expenses collection read...');
    const expensesRef = collection(db, 'expenses');
    const expensesSnapshot = await getDocs(expensesRef);
    console.log(`✅ Expenses collection accessible - Found ${expensesSnapshot.size} expenses`);
    
    expensesSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`   - ${data.description || 'No description'} - ${data.amount || data.amountAed || 0} AED (${doc.id})`);
    });

    // Test adding a sample rider (we'll delete it after)
    console.log('\n4. Testing write operations...');
    const testRider = {
      fullName: 'Test Rider - DELETE ME',
      email: 'test@example.com',
      phone: '+971501234567',
      nationality: 'UAE',
      status: 'Applied',
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(ridersRef, testRider);
    console.log('✅ Write operation successful - Test rider created with ID:', docRef.id);

    // Verify the test rider was created
    const updatedSnapshot = await getDocs(ridersRef);
    console.log(`✅ Verification successful - Riders collection now has ${updatedSnapshot.size} riders`);

    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('Firebase connection is working correctly.');
    console.log('\n⚠️  NOTE: A test rider was created. You may want to delete it from the Firebase console.');
    console.log(`Test rider ID: ${docRef.id}`);

  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    console.error('\nPossible issues:');
    console.error('- Firebase project configuration incorrect');
    console.error('- Network connectivity issues');
    console.error('- Firebase security rules blocking access');
    console.error('- Firebase project not active or billing issues');
  }
}

testFirebaseConnection();