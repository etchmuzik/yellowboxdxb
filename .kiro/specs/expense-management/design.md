# Expense Management System Design

## Overview

The Expense Management System is designed as a comprehensive financial tracking solution that integrates with Firebase Firestore for data persistence, Firebase Storage for receipt management, and implements role-based access control. The system follows a service-oriented architecture with clear separation between UI components, business logic, and data access layers.

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
- **ExpensesContent**: Main container component with routing and state management
- **ExpensesTable**: Data display with filtering, sorting, and pagination
- **AssignCostForm**: Expense creation and editing interface
- **ExpensesByCategory/ByRider**: Analytics and reporting views
- **Receipt Management**: File upload and preview components

### Service Layer
- **expenseService**: Core business logic and validation
- **expenseFirestoreService**: Database operations and queries
- **documentService**: Receipt upload and storage management
- **budgetService**: Budget tracking and monitoring

## Components and Interfaces

### Core Data Models

```typescript
interface Expense {
  id: string;
  riderId: string;
  riderName: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description: string;
  receiptUrl?: string;
  receiptFileName?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: string;
  rejectionNotes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  budgetLimit?: number;
  requiresApproval: boolean;
  approvalThreshold?: number;
}

interface Budget {
  id: string;
  category: string;
  monthYear: string;
  allocated: number;
  spent: number;
  remaining: number;
  lastUpdated: string;
}
```

### Component Interfaces

```typescript
interface ExpensesTableProps {
  expenses: Expense[];
  loading: boolean;
  onEdit: (expense: Expense) => void;
  onApprove: (expenseId: string) => void;
  onReject: (expenseId: string, notes: string) => void;
  onDelete: (expenseId: string) => void;
  userRole: UserRole;
}

interface AssignCostFormProps {
  expense?: Expense;
  riders: Rider[];
  categories: ExpenseCategory[];
  onSubmit: (expense: Partial<Expense>) => Promise<void>;
  onCancel: () => void;
}
```

## Data Models

### Firestore Collections

#### expenses
```typescript
{
  id: string;
  riderId: string;
  riderName: string;
  category: string;
  amount: number;
  date: Timestamp;
  description: string;
  receiptUrl?: string;
  receiptFileName?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvedAt?: Timestamp;
  rejectionNotes?: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### budgets
```typescript
{
  id: string;
  category: string;
  monthYear: string; // Format: "2024-01"
  allocated: number;
  spent: number;
  remaining: number;
  lastUpdated: Timestamp;
}
```

#### expenseCategories
```typescript
{
  id: string;
  name: string;
  budgetLimit?: number;
  requiresApproval: boolean;
  approvalThreshold?: number;
  active: boolean;
  createdAt: Timestamp;
}
```

## Error Handling

### Validation Strategy
- **Client-side**: React Hook Form with Zod schema validation
- **Service-layer**: Business rule validation before database operations
- **Database**: Firestore security rules for data integrity

### Error Types
```typescript
enum ExpenseErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RECEIPT_UPLOAD_FAILED = 'RECEIPT_UPLOAD_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR'
}
```

### Error Handling Flow
1. Form validation errors displayed inline
2. Service errors shown as toast notifications
3. Critical errors logged and reported to admin
4. Graceful degradation for non-critical features

## Testing Strategy

### Unit Testing
- **Components**: React Testing Library for UI interactions
- **Services**: Jest for business logic validation
- **Hooks**: Custom hook testing with renderHook
- **Utilities**: Pure function testing

### Integration Testing
- **Firebase Integration**: Mock Firebase services
- **Form Workflows**: End-to-end form submission testing
- **Role-based Access**: Permission testing across user roles

### Test Coverage Goals
- Components: 80% coverage
- Services: 90% coverage
- Critical paths: 100% coverage

### Testing Scenarios
```typescript
describe('Expense Management', () => {
  describe('Expense Creation', () => {
    it('should create expense with valid data');
    it('should validate required fields');
    it('should upload receipt successfully');
    it('should check budget limits');
  });
  
  describe('Approval Workflow', () => {
    it('should approve expense by finance user');
    it('should reject expense with notes');
    it('should prevent unauthorized approvals');
  });
  
  describe('Budget Monitoring', () => {
    it('should update budget on expense approval');
    it('should warn when approaching budget limit');
    it('should prevent budget overruns');
  });
});
```

## Security Considerations

### Authentication & Authorization
- Firebase Authentication for user identity
- Role-based access control (RBAC) implementation
- Route-level and component-level permission checks

### Data Security
- Firestore security rules for data access control
- Receipt files stored in Firebase Storage with access controls
- Sensitive data encryption at rest

### Input Validation
- Client-side validation for user experience
- Server-side validation for security
- SQL injection prevention (not applicable with Firestore)
- XSS prevention through React's built-in protections

## Performance Optimization

### Data Loading
- React Query for caching and background updates
- Pagination for large expense lists
- Lazy loading for receipt images
- Optimistic updates for better UX

### Bundle Optimization
- Code splitting by route
- Lazy loading of heavy components
- Tree shaking for unused code
- Image optimization for receipts

### Database Optimization
- Composite indexes for complex queries
- Query optimization for filtering and sorting
- Batch operations for bulk updates
- Connection pooling through Firebase SDK