# Yellow Box User Role Testing Guide

This guide provides comprehensive instructions for testing all user roles and their permissions in the Yellow Box application.

## Test Accounts

Use these credentials to test each role:

### 1. Admin Account
- **Email**: admin@yellowbox.ae
- **Password**: admin123
- **Expected Access**: Full system access

### 2. Operations Account
- **Email**: operations@yellowbox.ae
- **Password**: operations123
- **Expected Access**: Rider management, fleet tracking, activity logs

### 3. Finance Account
- **Email**: finance@yellowbox.ae
- **Password**: finance123
- **Expected Access**: Expense management, budgets, financial reports

### 4. Rider Account
- **Email**: rider@yellowbox.ae
- **Password**: rider123
- **Expected Access**: Personal dashboard only

## Test Scenarios

### Admin Role Testing

1. **Login & Dashboard**
   - ✅ Login with admin credentials
   - ✅ Should see Admin Dashboard at `/`
   - ✅ Should see all key metrics (riders, expenses, budgets)
   - ✅ Should see charts and analytics

2. **Navigation Access**
   - ✅ Should see all menu items in sidebar
   - ✅ Can access `/riders` - Riders management
   - ✅ Can access `/expenses` - Expense management
   - ✅ Can access `/visas` - Visa costs
   - ✅ Can access `/reports` - Reports
   - ✅ Can access `/activity` - Activity log
   - ✅ Can access `/bike-tracker` - Fleet tracking
   - ✅ Can access `/settings` - Settings
   - ✅ Can access `/profile` - Profile

3. **Functional Permissions**
   - ✅ Can create new riders
   - ✅ Can update rider status
   - ✅ Can approve/reject expenses
   - ✅ Can allocate budgets
   - ✅ Can export reports (PDF/CSV)
   - ✅ Can view all sensitive data

### Operations Role Testing

1. **Login & Dashboard**
   - ✅ Login with operations credentials
   - ✅ Should redirect to `/operations-dashboard`
   - ✅ Should see operations-specific metrics
   - ✅ Should see rider pipeline and fleet status

2. **Navigation Access**
   - ✅ Should see limited menu items
   - ✅ Can access `/riders` - Riders management
   - ✅ Can access `/bike-tracker` - Fleet tracking
   - ✅ Can access `/activity` - Activity log
   - ✅ Can access `/reports` - Reports
   - ✅ Can access `/settings` - Settings
   - ✅ Can access `/profile` - Profile
   - ❌ Cannot access `/expenses` - Should redirect
   - ❌ Cannot access `/visas` - Should redirect

3. **Functional Permissions**
   - ✅ Can create and manage riders
   - ✅ Can update rider application stages
   - ✅ Can assign/unassign bikes
   - ✅ Can view rider documents
   - ❌ Cannot approve/reject expenses
   - ❌ Cannot manage budgets

### Finance Role Testing

1. **Login & Dashboard**
   - ✅ Login with finance credentials
   - ✅ Should redirect to `/finance-dashboard`
   - ✅ Should see financial metrics
   - ✅ Should see pending expense approvals

2. **Navigation Access**
   - ✅ Should see finance-specific menu items
   - ✅ Can access `/expenses` - Expense management
   - ✅ Can access `/visas` - Visa costs
   - ✅ Can access `/riders` - For visa status monitoring
   - ✅ Can access `/reports` - Financial reports
   - ✅ Can access `/settings` - Settings
   - ✅ Can access `/profile` - Profile
   - ❌ Cannot access `/bike-tracker` - Should redirect
   - ❌ Cannot access `/activity` - Should redirect

3. **Functional Permissions**
   - ✅ Can approve/reject expenses
   - ✅ Can manage budgets
   - ✅ Can export financial reports
   - ✅ Can view expense analytics
   - ✅ Can track visa costs
   - ❌ Cannot update rider application status
   - ❌ Cannot manage bikes

### Rider Role Testing

1. **Login & Dashboard**
   - ✅ Login with rider credentials
   - ✅ Should redirect to `/rider-dashboard`
   - ✅ Should see personal information only
   - ✅ Should see own expense history

2. **Navigation Access**
   - ✅ Should see minimal menu items
   - ✅ Can access `/profile` - Personal profile
   - ❌ Cannot access `/riders` - Should redirect to dashboard
   - ❌ Cannot access `/expenses` - Should redirect
   - ❌ Cannot access `/reports` - Should redirect
   - ❌ Cannot access `/bike-tracker` - Should redirect
   - ❌ Cannot access `/activity` - Should redirect
   - ❌ Cannot access `/visas` - Should redirect

3. **Functional Permissions**
   - ✅ Can view own profile information
   - ✅ Can view own expense history
   - ✅ Can upload documents (if implemented)
   - ❌ Cannot see other riders' data
   - ❌ Cannot approve expenses
   - ❌ Cannot access management features

## Common Test Cases

### Authentication Flow
1. **Valid Login**
   - Enter correct credentials
   - Should redirect to role-specific dashboard
   - Should show correct user name in header

2. **Invalid Login**
   - Enter wrong password
   - Should show error message
   - Should remain on login page

3. **Logout**
   - Click logout button
   - Should redirect to login page
   - Should clear all session data

### Permission Denied
1. **Direct URL Access**
   - Login as rider
   - Try to access `/expenses` directly
   - Should redirect to rider dashboard
   - Should show "Access Denied" toast

2. **Navigation Attempt**
   - Login as operations
   - Try to access finance-only features
   - Should redirect appropriately
   - Should show permission error

### Data Visibility
1. **Rider Data**
   - Admin/Operations: See all riders
   - Finance: See riders for visa tracking
   - Rider: See only own data

2. **Expense Data**
   - Admin/Finance: See all expenses
   - Operations: No access
   - Rider: See only own expenses

## Testing Checklist

### Pre-Test Setup
- [ ] Clear browser cache and cookies
- [ ] Use incognito/private browsing mode
- [ ] Have test data ready (riders, expenses)
- [ ] Note any console errors

### During Testing
- [ ] Check page load times
- [ ] Verify data accuracy
- [ ] Test error handling
- [ ] Check responsive design
- [ ] Verify real-time updates

### Post-Test
- [ ] Document any bugs found
- [ ] Note UI/UX improvements
- [ ] Check for security issues
- [ ] Verify audit logs (if implemented)

## Known Issues & Limitations

1. **First-Time Setup**
   - New deployments may need initial data seeding
   - Admin account must be created manually

2. **Browser Compatibility**
   - Tested on Chrome, Firefox, Safari
   - IE11 not supported

3. **Mobile Experience**
   - Rider dashboard optimized for mobile
   - Admin features best on desktop

## Troubleshooting

### Login Issues
- Check Firebase Authentication is enabled
- Verify user exists in Firestore `users` collection
- Check role field is properly set

### Permission Issues
- Verify Firestore security rules are deployed
- Check user role in database
- Clear browser cache and retry

### Data Not Loading
- Check network tab for API errors
- Verify Firestore collections exist
- Check browser console for errors

## Contact

For issues or questions:
- Technical Issues: Check browser console and network logs
- Security Concerns: Report immediately to admin
- Feature Requests: Document and discuss with team