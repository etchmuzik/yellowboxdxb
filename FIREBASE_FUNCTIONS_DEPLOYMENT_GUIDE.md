# 🚀 Firebase Cloud Functions Deployment Guide

## 📋 **Current Status**
- ✅ `setUserRole` function ready in `yellowboxdxb-main/functions/src/index.ts` 
- ✅ Function dependencies configured in `package.json`
- ⏳ **NEXT STEP**: Deploy to production

## 🎯 **Quick Deployment (5 minutes)**

### **Step 1: Navigate to Functions Directory**
```bash
cd yellowboxdxb-main/functions
```

### **Step 2: Install Dependencies**
```bash
npm install
```

### **Step 3: Build Functions**
```bash
npm run build
```

### **Step 4: Deploy to Firebase**
```bash
firebase deploy --only functions
```

**Expected Output:**
```
✔ functions: Finished running predeploy script.
✔ functions[setUserRole(us-central1)]: Successful create operation.
✔ Deploy complete!

Functions deployed:
- setUserRole(us-central1)
  https://us-central1-yellowbox-8e0e6.cloudfunctions.net/setUserRole
```

## 🔧 **Function Details**

### **setUserRole Function**
- **Purpose**: Allows Admins to assign roles to users
- **Method**: HTTPS Callable
- **Authentication**: Required (Admin only)
- **Roles**: `Admin`, `Operations`, `Finance`, `Rider`

### **Usage Example**
```javascript
// In your web app
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const setUserRole = httpsCallable(functions, 'setUserRole');

// Call the function
try {
  const result = await setUserRole({
    userId: 'target-user-id',
    role: 'Operations'
  });
  console.log(result.data.message);
} catch (error) {
  console.error('Error:', error.message);
}
```

## 🧪 **Test After Deployment**

### **Test 1: Function Exists**
```bash
firebase functions:list
```

### **Test 2: Function Logs**
```bash
firebase functions:log --only setUserRole
```

### **Test 3: Direct Function Call** (via Firebase Console)
1. Go to Firebase Console → Functions
2. Find `setUserRole` function
3. Test with sample data:
```json
{
  "userId": "test-user-123",
  "role": "Operations"
}
```

## 🔄 **Integration with Web App**

### **Update Web App to Use Function**
Add to your authentication service:

```typescript
// src/services/authService.ts
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

export const assignUserRole = async (userId: string, role: string) => {
  const setUserRole = httpsCallable(functions, 'setUserRole');
  
  try {
    const result = await setUserRole({ userId, role });
    return result.data;
  } catch (error) {
    console.error('Failed to assign role:', error);
    throw error;
  }
};
```

## 🚨 **Troubleshooting**

### **Issue: Build Fails**
```bash
# Check TypeScript errors
npm run build

# Fix common issues
npm install --save-dev typescript@^5.1.6
```

### **Issue: Deployment Fails** 
```bash
# Check Firebase login
firebase login --reauth

# Check project selection
firebase use yellowbox-8e0e6
```

### **Issue: Function Not Callable**
- Verify user is authenticated as Admin
- Check custom claims are set correctly
- Review function logs for errors

## ✅ **Success Criteria**

After deployment, verify:
- [ ] Function appears in Firebase Console
- [ ] Function can be called from web app
- [ ] Only Admins can assign roles
- [ ] Custom claims are set correctly
- [ ] Function logs show successful executions

## 🎯 **Next Steps After Deployment**

1. **Test Role Assignment** - Verify admin can assign roles
2. **Update Web App UI** - Add role management interface
3. **Test User Permissions** - Verify role-based access works
4. **Proceed to MCP Server** - Deploy real-time infrastructure

---

**Priority**: 🔥 HIGH  
**Time Required**: 5 minutes  
**Dependencies**: N8N workflow fixed  
**Next Task**: MCP server deployment  