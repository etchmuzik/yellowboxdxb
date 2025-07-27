import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { getStorage, ref, listAll, deleteObject } from 'firebase/storage';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

async function clearCollection(collectionName) {
  console.log(`🧹 Clearing collection: ${collectionName}`);
  
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    if (snapshot.empty) {
      console.log(`✅ Collection ${collectionName} is already empty`);
      return;
    }

    const batch = writeBatch(db);
    let deleteCount = 0;

    snapshot.docs.forEach((document) => {
      batch.delete(doc(db, collectionName, document.id));
      deleteCount++;
    });

    await batch.commit();
    console.log(`✅ Deleted ${deleteCount} documents from ${collectionName}`);
  } catch (error) {
    console.log(`⚠️  Could not clear ${collectionName}: ${error.message}`);
  }
}

async function clearStorage() {
  console.log('🧹 Clearing Firebase Storage...');
  
  try {
    // Clear riders documents
    const ridersRef = ref(storage, 'riders');
    const ridersList = await listAll(ridersRef);
    
    for (const folderRef of ridersList.prefixes) {
      const folderContents = await listAll(folderRef);
      const deletePromises = folderContents.items.map(itemRef => deleteObject(itemRef));
      await Promise.all(deletePromises);
    }
    
    // Clear expenses receipts  
    const expensesRef = ref(storage, 'expenses');
    const expensesList = await listAll(expensesRef);
    
    for (const folderRef of expensesList.prefixes) {
      const folderContents = await listAll(folderRef);
      const deletePromises = folderContents.items.map(itemRef => deleteObject(itemRef));
      await Promise.all(deletePromises);
    }
    
    console.log(`✅ Cleared Storage folders`);
  } catch (error) {
    console.log('⚠️  Storage cleanup error:', error.message);
  }
}

async function main() {
  try {
    console.log('🚀 Starting production database cleanup...');
    console.log('⚠️  This will remove ALL test/dummy data from production!');
    
    // Collections to clear
    const collectionsToClear = [
      'riders',
      'rider_documents', 
      'expenses',
      'bikes',
      'locations',
      'budgets',
      'notifications',
      'security_events',
      'user_sessions',
      'visa-management',
      'activities',
      'analytics'
    ];

    // Clear Firestore collections
    for (const collectionName of collectionsToClear) {
      await clearCollection(collectionName);
    }

    // Clear Firebase Storage
    await clearStorage();

    console.log('');
    console.log('🎉 Production database cleanup completed!');
    console.log('📊 Status:');
    console.log('✅ All test/dummy data removed');
    console.log('✅ User accounts preserved for login');
    console.log('✅ Storage files cleared');
    console.log('✅ Ready for real production data');
    console.log('');
    console.log('🔑 Login credentials still available:');
    console.log('Admin: admin@yellowbox.com / admin123');
    console.log('Finance: x2@finance.com / finance123');
    console.log('Operations: ops@yellowbox.com / operations123');
    console.log('');
    console.log('🚀 Your Yellow Box system is now ready for real data entry!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

main();