# Firebase Security Patterns for Yellow Box

## Firestore Security Rules

### Role-Based Access Control
```javascript
// Base role checking function
function getUserRole() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
}

function isAdmin() {
  return getUserRole() == 'Admin';
}

function isOperations() {
  return getUserRole() in ['Admin', 'Operations'];
}

function isFinance() {
  return getUserRole() in ['Admin', 'Finance'];
}

function isRider() {
  return getUserRole() == 'Rider';
}
```

### Collection-Specific Rules

#### Riders Collection
```javascript
match /riders/{riderId} {
  // Operations and Admin can read/write all riders
  allow read, write: if isOperations();
  
  // Finance can read riders for expense management
  allow read: if isFinance();
  
  // Riders can only read their own data
  allow read: if isRider() && resource.data.userId == request.auth.uid;
  
  // Riders can update limited fields
  allow update: if isRider() && 
    resource.data.userId == request.auth.uid &&
    onlyUpdatingFields(['phone', 'email', 'expectedStartDate']);
}
```

#### Expenses Collection
```javascript
match /expenses/{expenseId} {
  // Finance can read/write all expenses
  allow read, write: if isFinance();
  
  // Operations can create and read expenses
  allow read, create: if isOperations();
  
  // Operations can update non-financial fields
  allow update: if isOperations() && 
    !('status' in request.resource.data) &&
    !('approvedBy' in request.resource.data);
  
  // Riders can read their own expenses
  allow read: if isRider() && resource.data.riderId == getRiderIdForUser();
}
```

#### Documents Collection
```javascript
match /documents/{documentId} {
  // Operations can read/write all documents
  allow read, write: if isOperations();
  
  // Riders can upload and read their own documents
  allow read, create: if isRider() && 
    resource.data.riderId == getRiderIdForUser();
  
  // Riders cannot modify verification status
  allow update: if isRider() && 
    resource.data.riderId == getRiderIdForUser() &&
    !('status' in request.resource.data) &&
    !('verifiedBy' in request.resource.data);
}
```

### Security Helper Functions
```javascript
function onlyUpdatingFields(allowedFields) {
  return request.resource.data.diff(resource.data).affectedKeys()
    .hasOnly(allowedFields);
}

function getRiderIdForUser() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.riderId;
}

function isOwner(userId) {
  return request.auth.uid == userId;
}

function isValidTimestamp(timestamp) {
  return timestamp is timestamp && 
    timestamp > request.time - duration.value(1, 'h') &&
    timestamp < request.time + duration.value(1, 'h');
}
```

## Firebase Storage Security Rules

### Document Storage Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Documents can only be uploaded by authenticated users
    match /documents/{riderId}/{documentType}/{fileName} {
      // Operations can read/write all documents
      allow read, write: if isOperations();
      
      // Riders can upload their own documents
      allow write: if isRider() && riderId == getRiderIdForUser();
      
      // Riders can read their own documents
      allow read: if isRider() && riderId == getRiderIdForUser();
      
      // File size and type validation
      allow write: if request.resource.size < 10 * 1024 * 1024 && // 10MB limit
        request.resource.contentType.matches('image/.*|application/pdf');
    }
    
    // Receipt storage for expenses
    match /receipts/{expenseId}/{fileName} {
      allow read, write: if isFinance() || isOperations();
      
      // File validation
      allow write: if request.resource.size < 5 * 1024 * 1024 && // 5MB limit
        request.resource.contentType.matches('image/.*|application/pdf');
    }
  }
}
```

## Authentication Patterns

### Custom Claims Setup
```typescript
// Set custom claims for user roles
export const setUserRole = async (uid: string, role: UserRole) => {
  await admin.auth().setCustomUserClaims(uid, { role });
  
  // Update user document with role
  await admin.firestore().collection('users').doc(uid).update({
    role,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
};

// Verify user role in API calls
export const verifyRole = (requiredRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { role } = req.user.customClaims;
    
    if (!requiredRoles.includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};
```

### Client-Side Auth Patterns
```typescript
// Auth context with role checking
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  return {
    ...context,
    isAdmin: () => context.user?.role === 'Admin',
    isOperations: () => ['Admin', 'Operations'].includes(context.user?.role),
    isFinance: () => ['Admin', 'Finance'].includes(context.user?.role),
    isRider: () => context.user?.role === 'Rider',
    hasPermission: (permission: Permission) => 
      checkPermission(context.user?.role, permission)
  };
};

// Route protection
export const ProtectedRoute = ({ 
  children, 
  requiredRoles 
}: {
  children: React.ReactNode;
  requiredRoles: UserRole[];
}) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  
  if (!user || !requiredRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return <>{children}</>;
};
```

## Data Validation Patterns

### Input Sanitization
```typescript
// Sanitize user input before Firestore operations
export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
};

// Validate data before database operations
export const validateRiderData = (data: Partial<Rider>): ValidationResult => {
  const errors: string[] = [];
  
  if (data.phone && !isValidPhoneNumber(data.phone)) {
    errors.push('Invalid phone number format');
  }
  
  if (data.email && !isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }
  
  if (data.visaNumber && !isValidVisaNumber(data.visaNumber)) {
    errors.push('Invalid visa number format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

## Security Best Practices

### 1. Never Trust Client Data
- Always validate data on the server side
- Use Firestore security rules as the primary defense
- Implement input sanitization for all user inputs

### 2. Principle of Least Privilege
- Grant minimum necessary permissions to each role
- Use specific field-level permissions where possible
- Regularly audit and review permissions

### 3. Secure File Uploads
- Validate file types and sizes
- Scan uploaded files for malware
- Use secure, time-limited download URLs

### 4. Audit and Monitoring
```typescript
// Log security-relevant events
export const logSecurityEvent = async (
  event: SecurityEvent,
  userId: string,
  details: any
) => {
  await admin.firestore().collection('security_logs').add({
    event,
    userId,
    details: sanitizeInput(details),
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    ip: getClientIP(),
    userAgent: getUserAgent()
  });
};

// Monitor for suspicious activity
export const detectSuspiciousActivity = (
  userId: string,
  action: string
): boolean => {
  // Implement rate limiting, unusual access patterns, etc.
  return false;
};
```

### 5. Environment-Specific Security
```typescript
// Production security configurations
const securityConfig = {
  production: {
    requireHTTPS: true,
    enableCORS: false,
    sessionTimeout: 3600000, // 1 hour
    maxLoginAttempts: 3,
    passwordPolicy: {
      minLength: 12,
      requireSpecialChars: true,
      requireNumbers: true
    }
  },
  development: {
    requireHTTPS: false,
    enableCORS: true,
    sessionTimeout: 86400000, // 24 hours
    maxLoginAttempts: 10,
    passwordPolicy: {
      minLength: 8,
      requireSpecialChars: false,
      requireNumbers: false
    }
  }
};
```

## Error Handling Security

### Secure Error Messages
```typescript
// Don't expose sensitive information in error messages
export const createSecureError = (
  internalError: Error,
  userMessage: string
): SecureError => {
  // Log full error details internally
  console.error('Internal error:', internalError);
  
  // Return sanitized error to client
  return {
    message: userMessage,
    code: 'OPERATION_FAILED',
    timestamp: new Date().toISOString()
  };
};

// Example usage
try {
  await updateRiderData(riderId, data);
} catch (error) {
  throw createSecureError(
    error,
    'Unable to update rider information. Please try again.'
  );
}
```