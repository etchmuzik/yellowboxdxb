const admin = require('firebase-admin');

// Initialize Firebase Admin with service account
const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://yellowbox-8e0e6-default-rtdb.firebaseio.com"
});

const auth = admin.auth();
const db = admin.firestore();

async function fixCustomClaims() {
  try {
    console.log('🔧 Fixing custom claims for existing users...');
    
    // Get all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      console.log(`📝 Processing user: ${userData.email} (${userData.role})`);
      
      try {
        // Set custom claims for this user
        await auth.setCustomUserClaims(userId, { 
          role: userData.role 
        });
        
        console.log(`✅ Set custom claims for ${userData.email}: role = ${userData.role}`);
        
        // Force token refresh by getting user record
        const userRecord = await auth.getUser(userId);
        console.log(`🔄 Token will refresh for ${userRecord.email} on next login`);
        
      } catch (error) {
        console.error(`❌ Error setting claims for ${userData.email}:`, error.message);
      }
    }
    
    console.log('🎉 Custom claims fix completed!');
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('1. Users must log out and log back in for new claims to take effect');
    console.log('2. You can now test login with: admin@yellowbox.com / YellowBox2024!Admin#Dubai');
    
  } catch (error) {
    console.error('💥 Error in fixCustomClaims:', error);
  } finally {
    process.exit(0);
  }
}

fixCustomClaims();