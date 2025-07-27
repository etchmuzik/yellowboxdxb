#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAy7LWZ6Ni0x2RiveXFEHaa6R0GYT63wVs",
  authDomain: "yellowbox-8e0e6.firebaseapp.com",
  projectId: "yellowbox-8e0e6",
  storageBucket: "yellowbox-8e0e6.firebasestorage.app",
  messagingSenderId: "47222199157",
  appId: "1:47222199157:web:7a5e3b808083be2d43393c"
};

console.log('🔍 TESTING RIDERS DATA STRUCTURE');
console.log('=================================\n');

async function testRidersData() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Get riders collection
    console.log('1. Fetching riders collection...');
    const ridersRef = collection(db, 'riders');
    const snapshot = await getDocs(ridersRef);
    
    console.log(`✅ Found ${snapshot.size} riders in database`);
    
    if (snapshot.size > 0) {
      console.log('\n2. Sample rider data structures:');
      
      let count = 0;
      snapshot.forEach((doc) => {
        if (count < 3) { // Show first 3 riders
          const data = doc.data();
          console.log(`\n--- Rider ${count + 1} (${doc.id}) ---`);
          console.log('Full Name:', data.fullName || 'MISSING');
          console.log('Email:', data.email || 'MISSING');
          console.log('Phone:', data.phone || 'MISSING');
          console.log('Nationality:', data.nationality || 'MISSING');
          console.log('Status:', data.status || 'MISSING');
          console.log('Created At:', data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : data.createdAt) : 'MISSING');
          console.log('All fields:', Object.keys(data));
          count++;
        }
      });
      
      console.log('\n3. Data structure analysis:');
      const firstDoc = snapshot.docs[0];
      const firstData = firstDoc.data();
      
      const requiredFields = ['fullName', 'email', 'phone'];
      const optionalFields = ['nationality', 'status', 'createdAt'];
      
      console.log('\nRequired fields check:');
      requiredFields.forEach(field => {
        const exists = field in firstData;
        const hasValue = firstData[field] && firstData[field].toString().trim() !== '';
        console.log(`${exists && hasValue ? '✅' : '❌'} ${field}: ${exists ? (hasValue ? 'HAS VALUE' : 'EMPTY') : 'MISSING'}`);
      });
      
      console.log('\nOptional fields check:');
      optionalFields.forEach(field => {
        const exists = field in firstData;
        console.log(`${exists ? '✅' : '⚠️'} ${field}: ${exists ? 'EXISTS' : 'MISSING'}`);
      });
    }

    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('- The app should be able to display riders if data structure is correct');
    console.log('- Check browser console for any JavaScript errors');
    console.log('- Verify the Riders page is using the correct service');

  } catch (error) {
    console.error('❌ Error testing riders data:', error);
  }
}

testRidersData();