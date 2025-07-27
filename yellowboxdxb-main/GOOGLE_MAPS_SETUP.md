# Google Maps Integration Setup

## Overview
The Yellow Box web app now includes full Google Maps integration for real-time driver tracking and expense management.

## Google Maps API Key
The app is configured with the following Google Maps API key:
```
AIzaSyBcay_rrC7iN9GKRAGoa8VaS75coP-GPr0
```

## Key Features Implemented

### 1. Real-Time Bike Tracking
- Live map showing all active riders' locations
- Real-time updates of rider positions
- District detection based on coordinates
- Speed and battery monitoring
- GPS tracker ID integration

### 2. Expense Management
- Real expense tracking with Firebase Firestore
- Multiple expense categories:
  - Visa Fees
  - Medical Test
  - Emirates ID
  - RTA Theory Test
  - RTA Road Test
  - Eye Test
  - Bike Maintenance
  - Uniform
  - Training
  - Insurance
  - Fuel
  - Other
- Receipt URL storage
- Expense approval workflow

### 3. Data Integration
- All data stored in Firebase Firestore
- Real-time synchronization
- Role-based access control
- Automatic location initialization for riders

## Setup Instructions

### 1. Environment Configuration
Create a `.env` file in the project root:
```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBcay_rrC7iN9GKRAGoa8VaS75coP-GPr0
```

### 2. Firebase Collections
The following collections will be automatically created:
- `bikeLocations` - Real-time rider locations
- `deliveries` - Delivery history tracking
- `expenses` - Expense records
- `riders` - Rider information
- `users` - User authentication data

### 3. First Run
On first run, the app will:
1. Initialize bike locations for existing riders
2. Set up default coordinates (Dubai center)
3. Configure district mapping

### 4. Adding Riders
When adding a new rider:
1. Their location will be automatically initialized
2. A GPS tracker ID will be generated
3. Bike registration will be created

### 5. Tracking Riders
To track riders in real-time:
1. Navigate to the "Bike Tracker" page
2. The map will show all active riders
3. Click on markers for detailed information
4. Use the sidebar to see rider list

## API Features Enabled

The Google Maps API key has the following APIs enabled:
- Maps JavaScript API
- Geocoding API
- Places API
- Directions API

## Security Notes

1. **Firestore Rules**: Updated to include bike locations and deliveries
2. **API Key Restrictions**: Consider adding domain restrictions in production
3. **Role-Based Access**: 
   - Admin/Operations: Full access
   - Finance: Read-only access to locations
   - Riders: Can update their own location

## Testing the Integration

1. **Add a Test Expense**:
   - Go to Expenses page
   - Click "Add Expense"
   - Fill in real data
   - Submit

2. **View Bike Locations**:
   - Go to Bike Tracker page
   - Map should load with rider locations
   - Click markers for details

3. **Check Real-Time Updates**:
   - Open Bike Tracker in two tabs
   - Update location in Firebase console
   - Both tabs should update

## Troubleshooting

### Map Not Loading
- Check browser console for errors
- Verify API key is set correctly
- Ensure APIs are enabled in Google Cloud Console

### No Rider Locations
- Run initialization script: Check console for "App data initialized successfully"
- Verify riders have assigned bikes
- Check Firestore for bikeLocations collection

### Expense Not Saving
- Check user authentication
- Verify user role (Admin/Operations)
- Check Firestore rules

## Production Deployment

Before deploying to production:
1. Add API key domain restrictions
2. Set up monitoring for API usage
3. Configure backup for Firestore
4. Set up error tracking
5. Enable Firebase App Check

## Support

For issues or questions:
- Check browser console for errors
- Review Firestore rules
- Verify API key configuration
- Check network requests in browser dev tools