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

console.log('🐛 DEBUGGING EXPENSE DATA LOADING');
console.log('==================================\\n');

async function debugExpenseData() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('1. Testing direct Firestore query (same as simpleExpenseService.getAll())...');
    const q = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    console.log(`✅ Raw Firestore query returned: ${snapshot.size} documents`);

    if (snapshot.size > 0) {
      console.log('\\n2. Sample raw document data:');
      const firstDoc = snapshot.docs[0];
      const rawData = firstDoc.data();
      console.log('Document ID:', firstDoc.id);
      console.log('Raw data:', JSON.stringify(rawData, null, 2));
      
      console.log('\\n3. Processed data (simulating simpleExpenseService.getAll()):');
      const processedData = {
        id: firstDoc.id,
        ...rawData,
        createdAt: rawData.createdAt?.toDate ? rawData.createdAt.toDate() : (rawData.createdAt ? new Date(rawData.createdAt) : new Date()),
        date: rawData.date?.toDate ? rawData.date.toDate() : (rawData.date ? new Date(rawData.date) : new Date())
      };
      console.log('Processed data:', JSON.stringify(processedData, null, 2));

      console.log('\\n4. All expense documents structure:');
      snapshot.docs.slice(0, 5).forEach((doc, index) => {
        const data = doc.data();
        console.log(`Expense ${index + 1}:`, {
          id: doc.id,
          riderId: data.riderId || 'MISSING',
          category: data.category || 'MISSING',
          description: data.description || 'MISSING',
          amountAed: data.amountAed || 'MISSING',
          amount: data.amount || 'MISSING',
          date: data.date || 'MISSING',
          status: data.status || 'MISSING',
          createdAt: data.createdAt ? 'EXISTS' : 'MISSING'
        });
      });
    }

    console.log('\\n5. Expected behavior in web app:');
    console.log('✅ Go to https://yellowboxdxb.web.app/expenses');
    console.log('✅ Check the yellow debug box at the top');
    console.log('✅ Look for \"Raw Expenses Count\" and \"Formatted Expenses Count\"');
    console.log('✅ Check browser console for debug logs');
    console.log('✅ If counts are 0, there is a data loading issue');
    console.log('✅ If counts > 0 but list is empty, there is a formatting issue');

    console.log('\\n🔍 DEBUG COMPLETE!');
    console.log('Check the web app debug info to see what is happening.');

  } catch (error) {
    console.error('❌ Error debugging expense data:', error);
  }
}

debugExpenseData();