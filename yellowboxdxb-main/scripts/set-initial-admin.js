/* eslint-disable @typescript-eslint/no-var-requires */
const admin = require('firebase-admin');

// --- IMPORTANT SETUP ---
// 1. Download your service account key JSON file from the Firebase console:
//    Project Settings > Service accounts > Firebase Admin SDK > Generate new private key.
// 2. Save it securely and DO NOT commit it to your git repository.
// 3. Update the path below to point to your downloaded service account key file.
const serviceAccount = require('/path/to/your/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Get the UID from the command-line arguments.
const uid = process.argv[2];

if (!uid) {
  console.error('Error: Please provide a user UID as a command-line argument.');
  console.log('Usage: node scripts/set-initial-admin.js <user-uid>');
  process.exit(1);
}

// Set the 'Admin' custom claim for the specified user.
admin.auth().setCustomUserClaims(uid, { role: 'Admin' })
  .then(() => {
    console.log(`✅ Success! Custom claim 'Admin' set for user ${uid}.`);
    console.log('This user can now log in and use the application to manage other user roles.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error setting custom claims:', error);
    process.exit(1);
  });