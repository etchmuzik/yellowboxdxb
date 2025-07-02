import { db } from '../config/firebase';
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { ApplicationStage, TestStatus, SpendCategory } from '../types';

// Sample riders data
const sampleRiders = [
  {
    fullName: 'Ahmed Hassan',
    nationality: 'Egyptian',
    phone: '+971501234567',
    email: 'ahmed.hassan@example.com',
    bikeType: 'Honda PCX 150',
    visaNumber: 'VIS-2024-001',
    applicationStage: 'Docs Verified' as ApplicationStage,
    testStatus: {
      theory: 'Pending' as TestStatus,
      road: 'Pending' as TestStatus,
      medical: 'Pass' as TestStatus
    },
    joinDate: '2025-06-01',
    expectedStart: '2025-07-01',
    notes: 'Strong candidate, previous delivery experience'
  },
  {
    fullName: 'Mohammed Ali',
    nationality: 'Pakistani',
    phone: '+971502345678',
    email: 'mohammed.ali@example.com',
    bikeType: 'Yamaha NMAX',
    visaNumber: 'VIS-2024-002',
    applicationStage: 'Theory Test' as ApplicationStage,
    testStatus: {
      theory: 'Pass' as TestStatus,
      road: 'Pass' as TestStatus,
      medical: 'Pass' as TestStatus
    },
    joinDate: '2025-05-15',
    expectedStart: '2025-06-15',
    notes: 'Completed all tests, starting training'
  },
  {
    fullName: 'Rajesh Kumar',
    nationality: 'Indian',
    phone: '+971503456789',
    email: 'rajesh.kumar@example.com',
    bikeType: 'Honda PCX 150',
    visaNumber: 'VIS-2024-003',
    applicationStage: 'Active' as ApplicationStage,
    testStatus: {
      theory: 'Pass' as TestStatus,
      road: 'Pass' as TestStatus,
      medical: 'Pass' as TestStatus
    },
    joinDate: '2025-04-01',
    expectedStart: '2025-04-15',
    notes: 'Active rider, excellent performance'
  }
];

// Sample expenses data
const sampleExpenses = [
  {
    category: 'Visa Fees' as SpendCategory,
    amountAed: 2500,
    date: '2025-06-01',
    description: 'UAE residence visa application fee',
    status: 'Approved'
  },
  {
    category: 'Medical' as SpendCategory,
    amountAed: 350,
    date: '2025-06-05',
    description: 'Medical fitness test for visa',
    status: 'Approved'
  },
  {
    category: 'RTA Tests' as SpendCategory,
    amountAed: 400,
    date: '2025-06-10',
    description: 'RTA theory test fee',
    status: 'Pending'
  },
  {
    category: 'Uniform' as SpendCategory,
    amountAed: 250,
    date: '2025-06-15',
    description: 'Yellow Box branded uniform set',
    status: 'Approved'
  }
];

export async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Add riders
    const riderIds: string[] = [];
    for (const rider of sampleRiders) {
      const docRef = await addDoc(collection(db, 'riders'), {
        ...rider,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      riderIds.push(docRef.id);
      console.log(`Added rider: ${rider.fullName} with ID: ${docRef.id}`);
    }
    
    // Add expenses (assign to random riders)
    for (const expense of sampleExpenses) {
      const randomRiderId = riderIds[Math.floor(Math.random() * riderIds.length)];
      await addDoc(collection(db, 'expenses'), {
        ...expense,
        riderId: randomRiderId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log(`Added expense: ${expense.category} for rider ID: ${randomRiderId}`);
    }
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// To run this script, call seedDatabase() from the browser console
// or create a button in your admin panel that triggers this function