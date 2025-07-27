#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
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

console.log('🔐 TESTING AUTHENTICATION STATUS');
console.log('==================================\n');

async function testAuthStatus() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    console.log('1. Testing unauthenticated access...');
    
    // Try to access data without authentication
    try {
      const ridersRef = collection(db, 'riders');
      const snapshot = await getDocs(ridersRef);
      console.log(`✅ Unauthenticated access works - Found ${snapshot.size} riders`);
      console.log('   This means Firestore rules allow public read access');
    } catch (error) {
      console.log('❌ Unauthenticated access failed:', error.code);
      console.log('   This means authentication is required');
      
      console.log('\n2. Testing anonymous authentication...');
      
      // Try anonymous authentication
      const userCredential = await signInAnonymously(auth);
      console.log('✅ Anonymous authentication successful');
      console.log('   User ID:', userCredential.user.uid);
      
      // Try accessing data with anonymous auth
      try {
        const ridersRef = collection(db, 'riders');
        const snapshot = await getDocs(ridersRef);
        console.log(`✅ Authenticated access works - Found ${snapshot.size} riders`);
      } catch (authError) {
        console.log('❌ Even authenticated access failed:', authError.code);
      }
    }

    console.log('\n3. Checking current auth state...');
    
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ User is signed in:', user.uid);
        console.log('   Anonymous:', user.isAnonymous);
        console.log('   Email:', user.email || 'None');
      } else {
        console.log('❌ No user is signed in');
      }
      
      console.log('\n🎯 RECOMMENDATIONS:');
      console.log('- If unauthenticated access works: The app should work without login');
      console.log('- If authentication is required: Users must log in first');
      console.log('- Check the app\'s authentication flow');
      console.log('- Verify RequireAuth component is working correctly');
      
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error testing auth status:', error);
  }
}

testAuthStatus();