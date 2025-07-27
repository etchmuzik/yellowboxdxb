// Simple, direct Firebase service - no complex abstractions
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/config/firebase';

// Simple Rider interface
export interface SimpleRider {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  nationality?: string;
  status: string;
  createdAt?: Date;
}

// Simple Expense interface  
export interface SimpleExpense {
  id?: string;
  riderId: string;
  riderName: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: Date;
}

// Simple Rider Operations
export const simpleRiderService = {
  // Create rider
  async create(rider: Omit<SimpleRider, 'id' | 'createdAt' | 'status' | 'nationality'> & Partial<Pick<SimpleRider, 'status' | 'nationality'>>): Promise<string> {
    console.log('🚀 Creating rider:', rider);
    
    const riderData = {
      ...rider,
      status: rider.status || 'Applied',
      nationality: rider.nationality || 'UAE',
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'riders'), riderData);
    console.log('✅ Rider created with ID:', docRef.id);
    return docRef.id;
  },

  // Get all riders
  async getAll(): Promise<SimpleRider[]> {
    console.log('📋 Fetching all riders...');
    
    const q = query(collection(db, 'riders'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const riders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        nationality: data.nationality || 'UAE',
        status: data.status || data.applicationStage || 'Applied',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date())
      };
    }) as SimpleRider[];
    
    console.log('✅ Found riders:', riders.length);
    return riders;
  }
};

// Simple Expense Operations
export const simpleExpenseService = {
  // Create expense
  async create(expense: Omit<SimpleExpense, 'id' | 'createdAt' | 'status'>): Promise<string> {
    console.log('🚀 Creating expense:', expense);
    
    const expenseData = {
      ...expense,
      status: 'pending' as const,
      createdAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'expenses'), expenseData);
    console.log('✅ Expense created with ID:', docRef.id);
    return docRef.id;
  },

  // Add new expense (alias for create)
  async add(expenseData: any): Promise<string> {
    console.log('💰 Adding expense:', expenseData);
    
    const docRef = await addDoc(collection(db, 'expenses'), {
      ...expenseData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    
    console.log('✅ Expense added with ID:', docRef.id);
    return docRef.id;
  },

  // Get all expenses
  async getAll(): Promise<any[]> {
    console.log('📋 Fetching all expenses...');
    
    const q = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const expenses = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
        date: data.date?.toDate ? data.date.toDate() : (data.date ? new Date(data.date) : new Date())
      };
    });
    
    console.log('✅ Found expenses:', expenses.length);
    return expenses;
  }
};