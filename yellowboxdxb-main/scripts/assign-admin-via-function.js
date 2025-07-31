import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Firebase configuration for yellowbox-8e0e6 project
const firebaseConfig = {
  apiKey: "AIzaSyB7qJ9rK_zG8bHvFhQ3YJxLj0iKpP1mMnY",
  authDomain: "yellowbox-8e0e6.firebaseapp.com",
  projectId: "yellowbox-8e0e6",
  storageBucket: "yellowbox-8e0e6.appspot.com",
  messagingSenderId: "1085875886849",
  appId: "1:1085875886849:web:c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app, 'us-central1');

async function assignFirstAdmin() {
  try {
    console.log('🔑 Attempting to assign first admin role...');
    console.log('ℹ️  Using bootstrap mode to bypass admin requirement');
    
    // We'll sign in as any authenticated user to call the function
    // The modified function allows admin assignment in bootstrap mode
    const userCredential = await signInWithEmailAndPassword(auth, 'admin@yellowbox.ae', 'password123');
    console.log('✅ Signed in successfully');
    
    // Get the setUserRole function
    const setUserRole = httpsCallable(functions, 'setUserRole');
    
    // Assign Admin role to admin@yellowbox.ae
    const targetUserId = '2n8OhW54aQUwvcLjNyjubsiYENu1'; // admin@yellowbox.ae
    console.log(`🎯 Assigning Admin role to user: ${targetUserId}`);
    
    const result = await setUserRole({
      userId: targetUserId,
      role: 'Admin'
    });
    
    console.log('🎉 SUCCESS!', result.data.message);
    console.log('');
    console.log('⚠️  IMPORTANT: The admin user must log out and log back in');
    console.log('   to refresh their Firebase ID token with the new role claims.');
    console.log('');
    console.log('🔄 Next steps:');
    console.log('   1. Admin user logs out and logs back in');
    console.log('   2. Run more role assignments if needed');
    console.log('   3. Disable bootstrap mode for security');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error assigning admin role:', error);
    
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      console.log('');
      console.log('💡 Trying alternative authentication...');
      return await tryAlternativeAuth();
    }
    return false;
  }
}

async function tryAlternativeAuth() {
  try {
    // Try with a different user that might exist
    console.log('🔑 Trying alternative user authentication...');
    
    const setUserRole = httpsCallable(functions, 'setUserRole');
    
    // Try to call the function without authentication (should work in bootstrap mode)
    const targetUserId = '2n8OhW54aQUwvcLjNyjubsiYENu1'; // admin@yellowbox.ae
    console.log(`🎯 Assigning Admin role to user: ${targetUserId} (bootstrap mode)`);
    
    const result = await setUserRole({
      userId: targetUserId,
      role: 'Admin'
    });
    
    console.log('🎉 SUCCESS!', result.data.message);
    return true;
    
  } catch (error) {
    console.error('❌ Alternative approach failed:', error);
    console.log('');
    console.log('💡 Manual steps required:');
    console.log('   1. Go to https://yellowboxdxb.com');
    console.log('   2. Sign in with admin@yellowbox.ae');
    console.log('   3. Open browser developer tools');
    console.log('   4. Run the following in console:');
    console.log('');
    console.log('   import { functions } from "./src/config/firebase.js";');
    console.log('   import { httpsCallable } from "firebase/functions";');
    console.log('   const setUserRole = httpsCallable(functions, "setUserRole");');
    console.log('   await setUserRole({ userId: "2n8OhW54aQUwvcLjNyjubsiYENu1", role: "Admin" });');
    console.log('');
    return false;
  }
}

// Run the assignment
assignFirstAdmin().then(success => {
  if (success) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});