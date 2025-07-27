# Rider Management System Design

## Overview

The Rider Management System is designed as a comprehensive lifecycle management solution for delivery drivers, handling their journey from initial application through to active employment status. The system integrates with Firebase for data persistence, implements document management with expiry tracking, and provides role-based access for different user types.

## Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │    │   Service Layer │    │   Firebase      │
│   Components    │◄──►│   Business      │◄──►│   Backend       │
│                 │    │   Logic         │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Architecture
- **RidersContent**: Main container with filtering and search
- **RidersTable**: Data display with stage filtering and status badges
- **AddRiderForm**: New rider registration interface
- **RiderDetail**: Comprehensive rider profile management
- **DocumentManagement**: Document upload and verification system
- **TestTracking**: Theory, Road, and Medical test management

### Service Layer
- **riderService**: Core business logic and validation
- **riderFirestoreService**: Database operations and queries
- **documentService**: Document upload and storage management
- **userService**: User account creation and role management

## Components and Interfaces

### Core Data Models

```typescript
interface Rider {
  id: string;
  fullName: string;
  nationality: string;
  phone: string;
  email: string;
  bikeType: 'Electric' | 'Manual';
  visaNumber: string;
  expectedStartDate: string;
  applicationStage: ApplicationStage;
  testStatus: TestStatus;
  documents: RiderDocument[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

type ApplicationStage = 
  | 'Applied' 
  | 'Docs Verified' 
  | 'Theory Test' 
  | 'Road Test' 
  | 'Medical' 
  | 'ID Issued' 
  | 'Active';

interface TestStatus {
  theory: TestResult;
  road: TestResult;
  medical: TestResult;
}

type TestResult = 'Pending' | 'Pass' | 'Fail';

interface RiderDocument {
  id: string;
  riderId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  status: DocumentStatus;
  expiryDate?: string;
  uploadedAt: string;
  uploadedBy: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
}

type DocumentType = 
  | 'Visa' 
  | 'Driver License' 
  | 'Medical Certificate' 
  | 'Insurance' 
  | 'ID Copy' 
  | 'Photo';

type DocumentStatus = 
  | 'Required' 
  | 'Pending' 
  | 'Valid' 
  | 'Expired' 
  | 'Rejected';
```

### Component Interfaces

```typescript
interface RidersTableProps {
  riders: Rider[];
  loading: boolean;
  onRiderClick: (rider: Rider) => void;
  onStageFilter: (stage: ApplicationStage | 'All') => void;
  onSearch: (query: string) => void;
  currentFilter: ApplicationStage | 'All';
}

interface AddRiderFormProps {
  onSubmit: (rider: Partial<Rider>) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

interface RiderDetailProps {
  rider: Rider;
  onUpdate: (updates: Partial<Rider>) => Promise<void>;
  onDocumentUpload: (document: File, type: DocumentType) => Promise<void>;
  onDocumentVerify: (documentId: string, status: DocumentStatus) => Promise<void>;
  onTestUpdate: (testType: keyof TestStatus, result: TestResult) => Promise<void>;
  userRole: UserRole;
}
```

## Data Models

### Firestore Collections

#### riders
```typescript
{
  id: string;
  fullName: string;
  nationality: string;
  phone: string;
  email: string;
  bikeType: 'Electric' | 'Manual';
  visaNumber: string;
  expectedStartDate: Timestamp;
  applicationStage: ApplicationStage;
  testStatus: {
    theory: TestResult;
    road: TestResult;
    medical: TestResult;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

#### documents
```typescript
{
  id: string;
  riderId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  status: DocumentStatus;
  expiryDate?: Timestamp;
  uploadedAt: Timestamp;
  uploadedBy: string;
  verifiedAt?: Timestamp;
  verifiedBy?: string;
  rejectionReason?: string;
}
```

#### users (for rider accounts)
```typescript
{
  uid: string;
  email: string;
  displayName: string;
  role: 'Rider-Applicant';
  riderId: string;
  createdAt: Timestamp;
  lastLogin?: Timestamp;
  active: boolean;
}
```

## Error Handling

### Validation Strategy
- **Client-side**: React Hook Form with Zod schema validation
- **Service-layer**: Business rule validation and stage progression logic
- **Database**: Firestore security rules for data integrity

### Error Types
```typescript
enum RiderErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_RIDER = 'DUPLICATE_RIDER',
  INVALID_STAGE_TRANSITION = 'INVALID_STAGE_TRANSITION',
  DOCUMENT_UPLOAD_FAILED = 'DOCUMENT_UPLOAD_FAILED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  DATABASE_ERROR = 'DATABASE_ERROR'
}
```

### Stage Transition Rules
```typescript
const VALID_STAGE_TRANSITIONS: Record<ApplicationStage, ApplicationStage[]> = {
  'Applied': ['Docs Verified'],
  'Docs Verified': ['Theory Test'],
  'Theory Test': ['Road Test'],
  'Road Test': ['Medical'],
  'Medical': ['ID Issued'],
  'ID Issued': ['Active'],
  'Active': [] // Terminal state
};
```

## Testing Strategy

### Unit Testing
- **Components**: React Testing Library for UI interactions
- **Services**: Jest for business logic validation
- **Stage Transitions**: Comprehensive testing of progression rules
- **Document Management**: File upload and validation testing

### Integration Testing
- **Firebase Integration**: Mock Firebase services
- **User Account Creation**: End-to-end account setup testing
- **Document Workflows**: Complete document upload and verification flows
- **Role-based Access**: Permission testing across user roles

### Test Coverage Goals
- Components: 80% coverage
- Services: 90% coverage
- Critical paths: 100% coverage

### Testing Scenarios
```typescript
describe('Rider Management', () => {
  describe('Rider Creation', () => {
    it('should create rider with valid data');
    it('should validate required fields');
    it('should prevent duplicate phone/email');
    it('should initialize with Applied stage');
  });
  
  describe('Stage Progression', () => {
    it('should allow valid stage transitions');
    it('should prevent invalid stage jumps');
    it('should require test completion for progression');
  });
  
  describe('Document Management', () => {
    it('should upload documents successfully');
    it('should track document expiry dates');
    it('should verify documents by operations staff');
  });
  
  describe('Test Tracking', () => {
    it('should update test results');
    it('should prevent stage progression with failed tests');
    it('should allow test retakes');
  });
});
```

## Security Considerations

### Authentication & Authorization
- Firebase Authentication for user identity
- Role-based access control (RBAC) implementation
- Rider self-service portal with limited permissions

### Data Security
- Firestore security rules for data access control
- Document files stored in Firebase Storage with access controls
- Personal data encryption and privacy compliance

### Document Security
- Secure file upload with virus scanning
- Access-controlled document URLs
- Audit trail for document access and modifications

## Performance Optimization

### Data Loading
- React Query for caching and background updates
- Pagination for large rider lists
- Lazy loading for document previews
- Optimistic updates for better UX

### Search and Filtering
- Client-side filtering for small datasets
- Server-side search for large datasets
- Debounced search input
- Indexed queries for performance

### Bundle Optimization
- Code splitting by route
- Lazy loading of heavy components
- Tree shaking for unused code
- Image optimization for documents

## Document Management Strategy

### File Storage
- Firebase Storage for secure file hosting
- Organized folder structure by rider and document type
- Automatic file cleanup for rejected documents
- Backup and disaster recovery procedures

### Document Lifecycle
1. **Upload**: Rider or operations staff uploads document
2. **Validation**: Automatic file type and size validation
3. **Review**: Operations staff reviews and verifies
4. **Approval/Rejection**: Status update with optional notes
5. **Expiry Tracking**: Automated alerts for expiring documents
6. **Renewal**: Process for document renewal and updates

### Expiry Management
- Automated daily checks for expiring documents
- Email notifications 30, 14, and 7 days before expiry
- Dashboard alerts for operations staff
- Bulk renewal processing capabilities