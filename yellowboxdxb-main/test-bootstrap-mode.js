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

console.log('🚀 BOOTSTRAP MODE TEST');
console.log('======================\n');

async function testBootstrapMode() {
  try {
    // Initialize Firebase
    console.log('1. Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('✅ Firebase initialized successfully');

    // Wait a moment for rules to propagate
    console.log('\n2. Waiting for rules to propagate...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test creating a simple rider
    console.log('\n3. Testing bootstrap mode - creating test rider...');
    const testRider = {
      fullName: 'Bootstrap Test Rider',
      email: 'bootstrap@test.com',
      phone: '+971501234567',
      nationality: 'UAE',
      status: 'Applied',
      createdAt: Timestamp.now()
    };

    const ridersRef = collection(db, 'riders');
    const docRef = await addDoc(ridersRef, testRider);
    console.log('✅ Bootstrap test successful - Rider created with ID:', docRef.id);

    // Test reading the data back
    console.log('\n4. Testing read access...');
    const snapshot = await getDocs(ridersRef);
    console.log(`✅ Read successful - Found ${snapshot.size} riders`);
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`   - ${data.fullName} (${doc.id})`);
    });

    console.log('\n🎉 BOOTSTRAP MODE IS WORKING!');
    console.log('The app should now be able to add and view riders/expenses.');

  } catch (error) {
    console.error('❌ Bootstrap test failed:', error);
    
    if (error.code === 'permission-denied') {
      console.error('\n🔧 TROUBLESHOOTING:');
      console.error('1. Check if Firestore rules were deployed correctly');
      console.error('2. Verify ENABLE_BOOTSTRAP is set to true');
      console.error('3. Wait a few minutes for rules to propagate');
      console.error('4. Check Firebase console for any issues');
    }
  }
}

testBootstrapMode();