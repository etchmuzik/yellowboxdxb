// Simple script to seed production database with sample data
// Run this in the browser console at https://yellowboxdxb.com

// Firebase configuration for yellowbox-8e0e6
const firebaseConfig = {
  apiKey: "AIzaSyAy7LWZ6Ni0x2RiveXFEHaa6R0GYT63wVs",
  authDomain: "yellowbox-8e0e6.firebaseapp.com",
  projectId: "yellowbox-8e0e6",
  storageBucket: "yellowbox-8e0e6.firebasestorage.app",
  messagingSenderId: "47222199157",
  appId: "1:47222199157:web:7a5e3b808083be2d43393c"
};

// Sample data to add
const sampleData = {
  riders: [
    {
      fullName: 'Ahmed Hassan',
      nationality: 'Egyptian',
      phone: '+971501234567',
      email: 'ahmed.hassan@example.com',
      bikeType: 'Honda PCX 150',
      visaNumber: 'VIS-2024-001',
      applicationStage: 'Docs Verified',
      testStatus: {
        theory: 'Pending',
        road: 'Pending',
        medical: 'Pass'
      },
      joinDate: '2025-06-01',
      expectedStart: '2025-07-01',
      notes: 'Strong candidate, previous delivery experience',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      fullName: 'Mohammed Ali',
      nationality: 'Pakistani',
      phone: '+971502345678',
      email: 'mohammed.ali@example.com',
      bikeType: 'Yamaha NMAX',
      visaNumber: 'VIS-2024-002',
      applicationStage: 'Theory Test',
      testStatus: {
        theory: 'Pass',
        road: 'Pass',
        medical: 'Pass'
      },
      joinDate: '2025-05-15',
      expectedStart: '2025-06-15',
      notes: 'Completed all tests, starting training',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      fullName: 'Rajesh Kumar',
      nationality: 'Indian',
      phone: '+971503456789',
      email: 'rajesh.kumar@example.com',
      bikeType: 'Honda PCX 150',
      visaNumber: 'VIS-2024-003',
      applicationStage: 'Active',
      testStatus: {
        theory: 'Pass',
        road: 'Pass',
        medical: 'Pass'
      },
      joinDate: '2025-04-01',
      expectedStart: '2025-04-15',
      notes: 'Active rider, excellent performance',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

// Instructions for manual seeding
console.log('🌱 Yellow Box Database Seeding Instructions');
console.log('==========================================');
console.log('1. Open https://yellowboxdxb.com');
console.log('2. Open browser DevTools (F12)');
console.log('3. Go to Console tab');
console.log('4. Copy and paste the following code:');
console.log('');
console.log('// Initialize Firebase');
console.log('const firebaseConfig =', JSON.stringify(firebaseConfig, null, 2));
console.log('');
console.log('// Add sample riders');
console.log('sampleData.riders.forEach(async (rider) => {');
console.log('  await firebase.firestore().collection("riders").add(rider);');
console.log('});');
console.log('');
console.log('// Or use this complete script:');
console.log('const addSampleData = async () => {');
console.log('  const batch = firebase.firestore().batch();');
console.log('  const ridersRef = firebase.firestore().collection("riders");');
console.log('  sampleData.riders.forEach(rider => {');
console.log('    batch.set(ridersRef.doc(), rider);');
console.log('  });');
console.log('  await batch.commit();');
console.log('  console.log("✅ Sample data added successfully!");');
console.log('};');
console.log('');
console.log('// Run: addSampleData();');

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { sampleData, firebaseConfig };
}
