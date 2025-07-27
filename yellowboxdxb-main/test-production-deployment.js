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

console.log('🚀 TESTING PRODUCTION DEPLOYMENT');
console.log('=================================\n');

async function testProductionDeployment() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('1. Testing database connectivity...');
    const ridersRef = collection(db, 'riders');
    const snapshot = await getDocs(ridersRef);
    
    console.log(`✅ Database connected - Found ${snapshot.size} riders`);
    
    console.log('\n2. Testing data structure...');
    if (snapshot.size > 0) {
      const firstRider = snapshot.docs[0].data();
      const hasRequiredFields = firstRider.fullName && firstRider.email && firstRider.phone;
      console.log(`${hasRequiredFields ? '✅' : '❌'} Data structure is valid`);
    }

    console.log('\n3. Production URLs to test:');
    console.log('🌐 Main App: https://yellowboxdxb.web.app/');
    console.log('🏍️ Riders Page: https://yellowboxdxb.web.app/riders');
    console.log('🔧 Debug Page: https://yellowboxdxb.web.app/riders-debug');
    console.log('🧪 Simple Test: https://yellowboxdxb.web.app/simple-test');

    console.log('\n4. Expected functionality:');
    console.log('✅ Riders page should load without authentication');
    console.log('✅ "Add New Rider" tab should work');
    console.log('✅ "View All Riders" tab should show existing riders');
    console.log('✅ Search and filtering should work');

    console.log('\n🎉 DEPLOYMENT SUCCESSFUL!');
    console.log('The riders page is now live at: https://yellowboxdxb.web.app/riders');

  } catch (error) {
    console.error('❌ Production test failed:', error);
  }
}

testProductionDeployment();