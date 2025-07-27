# Fix "Failed to assign cost" Error

## ✅ What We've Done

1. **Updated Firestore Security Rules**
   - Deployed comprehensive rules from yellowboxdxb project
   - Added proper permission checks for expense creation
   - Rules now properly validate user roles

2. **Created User Role Management Tool**
   - `check-user-roles.html` - Use this to verify and update user roles

## 🔧 Steps to Fix the Error

### 1. Check Your User Role
Open `check-user-roles.html` in a browser while running the app locally, or deploy it temporarily:
```bash
# Option 1: Open locally
open check-user-roles.html

# Option 2: Deploy temporarily (remove after fixing)
cp check-user-roles.html dist/
firebase deploy --only hosting
# Then visit: https://yellowbox-8e0e6.web.app/check-user-roles.html
```

### 2. Verify/Update User Roles
The expense assignment requires one of these roles:
- **Admin** - Full access
- **Finance** - Can manage expenses and budgets

If your user doesn't have the correct role:
1. Use the tool to update your role to Admin or Finance
2. Or have an Admin user update your role

### 3. Common Issues and Solutions

#### Issue: "Permission Denied"
**Solution**: User needs Admin or Finance role

#### Issue: "User document not found"
**Solution**: The tool will create a user document automatically

#### Issue: "Session expired"
**Solution**: Log out and log back in

## 📋 Technical Details

### Required Permissions for Expense Creation
```javascript
// From Firestore rules
function canAssignCosts() {
  return hasRole('Admin') || hasRole('Finance');
}
```

### Expense Data Requirements
- `riderId` - Valid rider ID
- `category` - Must be from allowed categories
- `amountAed` - Between 0 and 50,000
- `date` - Valid date string
- `description` - 5-500 characters
- `createdBy` - Must match authenticated user

## 🚀 Testing After Fix

1. Ensure you have Admin or Finance role
2. Try assigning a cost again
3. Check browser console for any errors
4. Verify the expense appears in the database

## 🔒 Security Notes

- The updated rules are more secure and comprehensive
- Bootstrap mode allows initial setup when no users exist
- All expense operations are now properly validated
- Audit logging tracks all expense operations

## 📞 If Still Having Issues

1. Check browser console for detailed error messages
2. Verify Firebase Authentication is working
3. Ensure Firestore rules are deployed (check Firebase Console)
4. Try in incognito mode to rule out cache issues

The expense assignment should now work properly with the correct user role!