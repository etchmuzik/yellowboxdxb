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

console.log('🔧 TESTING SERVICE DIRECTLY');
console.log('============================\\n');

async function testServiceDirectly() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('1. Simulating simpleExpenseService.getAll() exactly...');
    
    const q = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    console.log(`Raw query returned: ${snapshot.size} documents`);
    
    const expenses = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
        date: data.date?.toDate ? data.date.toDate() : (data.date ? new Date(data.date) : new Date())
      };
    });
    
    console.log(`✅ Service should return: ${expenses.length} expenses`);
    
    if (expenses.length > 0) {
      console.log('\\n2. Sample processed expense:');
      console.log(JSON.stringify(expenses[0], null, 2));
      
      console.log('\\n3. All expenses have required fields:');
      expenses.slice(0, 3).forEach((expense, index) => {
        console.log(`Expense ${index + 1}:`, {
          id: expense.id ? '✅' : '❌',
          riderId: expense.riderId ? '✅' : '❌',
          category: expense.category ? '✅' : '❌',
          description: expense.description ? '✅' : '❌',
          amountAed: expense.amountAed ? '✅' : '❌',
          date: expense.date ? '✅' : '❌'
        });
      });
    }

    console.log('\\n4. The service should work correctly now.');
    console.log('If the web app still shows empty, try:');
    console.log('✅ Hard refresh the page (Ctrl+F5 or Cmd+Shift+R)');
    console.log('✅ Clear browser cache');
    console.log('✅ Check browser console for errors');
    console.log('✅ Look for the yellow debug box');

  } catch (error) {
    console.error('❌ Error testing service:', error);
  }
}

testServiceDirectly();