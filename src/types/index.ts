
// Application stage types
export type ApplicationStage = 
  | 'Applied' 
  | 'Docs Verified' 
  | 'Theory Test' 
  | 'Road Test' 
  | 'Medical' 
  | 'ID Issued' 
  | 'Active';

export type TestStatus = 'Pending' | 'Pass' | 'Fail';

export type SpendCategory = 
  | 'Visa Fees' 
  | 'RTA Tests' 
  | 'Medical' 
  | 'Medical Test'
  | 'Emirates ID'
  | 'RTA Theory Test'
  | 'RTA Road Test'
  | 'Eye Test'
  | 'Bike Maintenance'
  | 'Residency ID' 
  | 'Training' 
  | 'Uniform' 
  | 'Insurance'
  | 'Fuel'
  | 'Other';

// Document types and status
export type DocumentType = 'Visa' | 'Driver License' | 'Medical Certificate' | 'Insurance' | 'Residency ID' | 'Theory Test' | 'Road Test';
export type DocumentStatus = 'Valid' | 'Expired' | 'Required' | 'Pending' | 'Rejected';

// Document data type
export interface RiderDocument {
  id: string;
  type: DocumentType;
  fileName: string;
  fileUrl?: string; // Optional because it may be pending upload
  uploadDate: string; // ISO date string
  expiryDate?: string; // ISO date string, optional as not all docs expire
  status: DocumentStatus;
  notes?: string;
}

// Rider data type
export interface Rider {
  id: string;
  fullName: string;
  nationality: string;
  phone: string;
  email: string;
  bikeType: string;
  visaNumber: string;
  applicationStage: ApplicationStage;
  testStatus: {
    theory: TestStatus;
    road: TestStatus;
    medical: TestStatus;
  };
  joinDate: string; // ISO date string
  expectedStart: string; // ISO date string
  notes: string;
  assignedBikeId?: string; // New field to link rider to a bike
  documents?: RiderDocument[]; // New field to track uploaded documents
}

// Spend event data type
export type SpendEvent = {
  id: string;
  riderId: string;
  riderName?: string; // Added for display purposes
  category: SpendCategory;
  amountAed: number;
  date: string; // ISO date string
  description: string;
  receiptUrl?: string;
  status?: 'pending' | 'approved' | 'rejected'; // Added status field
  rejectionReason?: string; // Added for rejected expenses
  approvedAt?: string; // ISO date string
  rejectedAt?: string; // ISO date string
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

// Budget data type
export interface Budget {
  id: string;
  month: string; // Format: YYYY-MM
  allocatedAed: number; // Deprecated, use totalBudget
  spentAed: number; // Calculated from SpendEvents
  totalBudget: number; // Total budget for the month
  categoryBudgets?: Record<SpendCategory, number>; // Budget allocation per category
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

// User role type
export type UserRole = 'Admin' | 'Operations' | 'Finance' | 'Rider-Applicant';

// User data type
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string; // Added optional password field for mock testing
}

// Bike data type
export interface Bike {
  id: string;
  model: string;
  registrationNumber: string;
  gpsTrackerId: string;
  status: 'Available' | 'Assigned' | 'Maintenance';
  assignedRiderId?: string;
  lastMaintenanceDate?: string;
}
