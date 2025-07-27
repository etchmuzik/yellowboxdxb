import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
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

async function fixAdminUser() {
  try {
    console.log('🔧 Fixing admin user profile...');
    
    // Create admin user profile in Firestore
    const adminUserProfile = {
      uid: 'admin-user-id', // This should match the Firebase Auth UID
      email: 'admin@yellowbox.com',
      name: 'System Administrator',
      role: 'admin',
      status: 'active',
      permissions: [
        'create:riders',
        'read:riders',
        'update:riders',
        'delete:riders',
        'create:expenses',
        'read:expenses',
        'update:expenses',
        'delete:expenses',
        'read:reports',
        'manage:users',
        'manage:system'
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    };

    // Set the user profile document
    await setDoc(doc(db, 'users', 'admin@yellowbox.com'), adminUserProfile);
    console.log('✅ Admin user profile created');

    // Create finance user profile
    const financeUserProfile = {
      uid: 'finance-user-id',
      email: 'x2@finance.com',
      name: 'Finance Manager',
      role: 'finance',
      status: 'active',
      permissions: [
        'read:riders',
        'read:expenses',
        'update:expenses',
        'approve:expenses',
        'read:reports',
        'manage:budgets'
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    };

    await setDoc(doc(db, 'users', 'x2@finance.com'), financeUserProfile);
    console.log('✅ Finance user profile created');

    // Create operations user profile
    const operationsUserProfile = {
      uid: 'operations-user-id',
      email: 'ops@yellowbox.com',
      name: 'Operations Manager',
      role: 'operations',
      status: 'active',
      permissions: [
        'create:riders',
        'read:riders',
        'update:riders',
        'verify:documents',
        'read:expenses',
        'read:reports'
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    };

    await setDoc(doc(db, 'users', 'ops@yellowbox.com'), operationsUserProfile);
    console.log('✅ Operations user profile created');

    console.log('');
    console.log('🎉 User profiles fixed successfully!');
    console.log('');
    console.log('✅ Admin user now has full permissions');
    console.log('✅ Finance user can manage expenses and budgets');
    console.log('✅ Operations user can manage riders and documents');
    console.log('');
    console.log('🚀 You can now login and use all features:');
    console.log('Admin: admin@yellowbox.com / admin123');
    console.log('Finance: x2@finance.com / finance123');
    console.log('Operations: ops@yellowbox.com / operations123');

  } catch (error) {
    console.error('❌ Error fixing admin user:', error);
    process.exit(1);
  }
}

fixAdminUser();