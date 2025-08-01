import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { User } from '../types';

// Test user credentials
const testUsers = [
  {
    email: 'admin@yellowbox.ae',
    password: 'Admin123!',
    name: 'Admin User',
    role: 'Admin' as User['role']
  },
  {
    email: 'operations@yellowbox.ae',
    password: 'Operations123!',
    name: 'Operations Manager',
    role: 'Operations' as User['role']
  },
  {
    email: 'finance@yellowbox.ae',
    password: 'Finance123!',
    name: 'Finance Manager',
    role: 'Finance' as User['role']
  },
  {
    email: 'rider@yellowbox.ae',
    password: 'Rider123!',
    name: 'Test Rider',
    role: 'Rider-Applicant' as User['role']
  }
];

export async function createTestUsers() {
  
  for (const testUser of testUsers) {
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        testUser.email,
        testUser.password
      );
      
      const user = userCredential.user;
      
      // Create user document in Firestore
      const userData: User = {
        id: user.uid,
        name: testUser.name,
        email: testUser.email,
        role: testUser.role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);

    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'auth/email-already-in-use') {
      } else if (error instanceof Error) {
        console.error(`❌ Error creating ${testUser.email}:`, error.message);
      } else {
        console.error(`❌ Error creating ${testUser.email}:`, error);
      }
    }
  }
  
  testUsers.forEach(user => {
  });
}

// To run this: 
// 1. Import this function in your app
// 2. Call createTestUsers() from browser console
// 3. Or add a button in your admin panel