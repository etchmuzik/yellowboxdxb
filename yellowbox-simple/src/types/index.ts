// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'operations' | 'finance' | 'rider-applicant';
  createdAt: string;
  updatedAt: string;
}

// Rider types
export interface Rider {
  id: string;
  fullName: string;
  nationality: string;
  phone: string;
  email: string;
  bikeType: string;
  visaNumber: string;
  applicationStage: 'Applied' | 'Documents Verified' | 'Theory Test' | 'Road Test' | 'Medical' | 'ID Issued' | 'Active';
  testStatus: {
    theory: 'Pending' | 'Passed' | 'Failed';
    road: 'Pending' | 'Passed' | 'Failed';
    medical: 'Pending' | 'Passed' | 'Failed';
  };
  joinDate: string;
  expectedStart: string;
  notes: string;
  assignedBikeId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Document types
export interface Document {
  id: string;
  riderId: string;
  type: 'passport' | 'visa' | 'license' | 'emirates-id' | 'other';
  fileName: string;
  fileUrl?: string;
  uploadDate: string;
  expiryDate?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  notes?: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy: string;
}

// Expense types
export interface Expense {
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

// Bike types
export interface Bike {
  id: string;
  brand: string;
  model: string;
  plateNumber: string;
  riderId?: string;
  status: 'Available' | 'Assigned' | 'Maintenance';
  gpsEnabled: boolean;
  lastLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Budget types
export interface Budget {
  id: string;
  month: string;
  allocatedAed: number;
  spentAed: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}