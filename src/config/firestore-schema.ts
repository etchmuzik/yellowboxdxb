
import { DocumentReference } from "firebase/firestore";

// Firestore collection names
export const COLLECTIONS = {
  USERS: "users",
  RIDERS: "riders", 
  DOCUMENTS: "documents",
  EXPENSES: "expenses",
  BUDGETS: "budgets",
  BIKES: "bikes",
  NOTIFICATIONS: "notifications"
} as const;

// Firestore document interfaces with Firebase-specific fields
export interface FirestoreRider {
  id: string;
  fullName: string;
  nationality: string;
  phone: string;
  email: string;
  bikeType: string;
  visaNumber: string;
  applicationStage: string;
  testStatus: {
    theory: string;
    road: string;
    medical: string;
  };
  joinDate: string;
  expectedStart: string;
  notes: string;
  assignedBikeId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface FirestoreDocument {
  id: string;
  riderId: string;
  type: string;
  fileName: string;
  fileUrl?: string;
  uploadDate: string;
  expiryDate?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy: string;
}

export interface FirestoreExpense {
  id: string;
  riderId: string;
  category: string;
  amountAed: number;
  date: string;
  description: string;
  receiptUrl?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface FirestoreBudget {
  id: string;
  month: string;
  allocatedAed: number;
  spentAed: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface FirestoreNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
  data?: Record<string, any>;
}
