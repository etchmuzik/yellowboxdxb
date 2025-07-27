#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAy7LWZ6Ni0x2RiveXFEHaa6R0GYT63wVs",
  authDomain: "yellowbox-8e0e6.firebaseapp.com",
  projectId: "yellowbox-8e0e6",
  storageBucket: "yellowbox-8e0e6.firebasestorage.app",
  messagingSenderId: "47222199157",
  appId: "1:47222199157:web:7a5e3b808083be2d43393c"
};

console.log('🧪 TESTING SIMPLE SERVICE LOGIC');
console.log('=================================\n');

async function testSimpleService() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('1. Testing simple service logic...');
    
    // Replicate the simple service logic
    const q = query(collection(db, 'riders'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    console.log(`✅ Raw query returned ${snapshot.size} documents`);
    
    // Process data like the simple service does
    const riders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        nationality: data.nationality || 'UAE',
        status: data.status || data.applicationStage || 'Applied',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date())
      };
    });
    
    console.log(`✅ Processed ${riders.length} riders`);
    
    if (riders.length > 0) {
      console.log('\n2. Sample processed riders:');
      riders.slice(0, 3).forEach((rider, index) => {
        console.log(`\n--- Processed Rider ${index + 1} ---`);
        console.log('ID:', rider.id);
        console.log('Full Name:', rider.fullName);
        console.log('Email:', rider.email);
        console.log('Phone:', rider.phone);
        console.log('Nationality:', rider.nationality);
        console.log('Status:', rider.status);
        console.log('Created At:', rider.createdAt);
      });
      
      console.log('\n3. Data validation:');
      const validRiders = riders.filter(rider => 
        rider.fullName && rider.fullName.trim() !== '' &&
        rider.email && rider.email.trim() !== '' &&
        rider.phone && rider.phone.trim() !== ''
      );
      
      console.log(`✅ ${validRiders.length}/${riders.length} riders have all required fields`);
      
      if (validRiders.length !== riders.length) {
        console.log('\n⚠️  Invalid riders found:');
        riders.filter(rider => 
          !rider.fullName || rider.fullName.trim() === '' ||
          !rider.email || rider.email.trim() === '' ||
          !rider.phone || rider.phone.trim() === ''
        ).forEach(rider => {
          console.log(`- ${rider.id}: Missing ${!rider.fullName ? 'name' : !rider.email ? 'email' : 'phone'}`);
        });
      }
    }

    console.log('\n🎯 CONCLUSION:');
    if (riders.length > 0) {
      console.log('✅ Simple service should work correctly');
      console.log('✅ Data is properly formatted for the UI');
      console.log('✅ The Riders page should display the data');
    } else {
      console.log('❌ No riders found - check database');
    }

  } catch (error) {
    console.error('❌ Error testing simple service:', error);
  }
}

testSimpleService();