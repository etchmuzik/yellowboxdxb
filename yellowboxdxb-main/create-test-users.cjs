const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'yellowbox-8e0e6'
    });
  } catch (error) {
    console.error('Firebase initialization error:', error);
    process.exit(1);
  }
}

const auth = admin.auth();
const firestore = admin.firestore();

// Test user credentials for all roles
const testUsers = [
  {
    email: 'admin@yellowbox.com',
    password: 'YellowBox2024!',
    role: 'Admin',
    name: 'Admin User'
  },
  {
    email: 'operations@yellowbox.com',
    password: 'YellowBox2024!',
    role: 'Operations',
    name: 'Operations Manager'
  },
  {
    email: 'finance@yellowbox.com',
    password: 'YellowBox2024!',
    role: 'Finance',
    name: 'Finance Manager'
  },
  {
    email: 'rider@yellowbox.com',
    password: 'YellowBox2024!',
    role: 'Rider-Applicant',
    name: 'Test Rider'
  }
];

async function createTestUsers() {
  console.log('🚀 Creating test users...\n');
  
  for (const userData of testUsers) {
    try {
      console.log(`Creating user: ${userData.email}`);
      
      let userRecord;
      
      // Try to get existing user
      try {
        userRecord = await auth.getUserByEmail(userData.email);
        console.log(`✅ User exists: ${userData.email}`);
        
        // Update password
        await auth.updateUser(userRecord.uid, {
          password: userData.password,
          displayName: userData.name
        });
        
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          // Create new user
          userRecord = await auth.createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.name,
            emailVerified: true
          });
          console.log(`✅ Created user: ${userData.email}`);
        } else {
          throw error;
        }
      }

      // Set custom claims
      await auth.setCustomUserClaims(userRecord.uid, {
        role: userData.role
      });

      // Create user document in Firestore
      await firestore.collection('users').doc(userRecord.uid).set({
        id: userRecord.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      console.log(`✅ Set role '${userData.role}' for: ${userData.email}\n`);
      
    } catch (error) {
      console.error(`❌ Error creating user ${userData.email}:`, error);
    }
  }
  
  console.log('🎯 Test users created! Login credentials:');
  console.log('='.repeat(50));
  testUsers.forEach(user => {
    console.log(`${user.role}: ${user.email} / ${user.password}`);
  });
}

createTestUsers().catch(console.error);