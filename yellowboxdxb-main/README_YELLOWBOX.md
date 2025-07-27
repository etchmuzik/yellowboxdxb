# Yellow Box - Driver Expense & Fleet Management System

## Overview
Yellow Box is a comprehensive web application for managing delivery driver operations, expenses, and real-time fleet tracking in Dubai. Built with modern React and Firebase technologies, it provides a complete solution for driver management, expense tracking, document management, and live GPS tracking.

## ✨ Key Features

### 🚴 Driver Management
- Complete rider lifecycle management
- Application stage tracking (Applied → Training → Visa → Joined)
- Test status monitoring (Theory, Road, Medical)
- Document management with expiry tracking

### 💰 Expense Tracking
- Real expense recording with multiple categories
- Receipt upload and storage
- Expense approval workflow
- Budget monitoring and reporting
- Category-wise and rider-wise expense views

### 🗺️ Real-Time Fleet Tracking
- **Live GPS tracking with Google Maps integration**
- Real-time rider location updates
- District-based location detection
- Speed and battery monitoring
- Interactive map with custom markers

### 📊 Reporting & Analytics
- Comprehensive dashboards
- Expense analytics by category and rider
- Fleet performance metrics
- Export capabilities

### 🔐 Role-Based Access Control
- **Admin**: Full system access
- **Operations**: Rider and expense management
- **Finance**: Financial data and approvals
- **Rider**: Self-service portal

## 🚀 Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + Shadcn/ui
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Maps**: Google Maps API
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6

## 📋 Prerequisites

- Node.js 16+ and npm/yarn
- Firebase project with Firestore, Authentication, and Storage enabled
- Google Maps API key with Maps JavaScript API enabled

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd yellowbox
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id

   # Google Maps API Key
   VITE_GOOGLE_MAPS_API_KEY=AIzaSyBcay_rrC7iN9GKRAGoa8VaS75coP-GPr0
   ```

4. **Deploy Firestore Security Rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 📍 Google Maps Integration

The app includes full Google Maps integration for real-time tracking:

### Features
- Live rider location tracking
- Interactive map markers with rider details
- District-based location detection
- Real-time position updates
- GPS tracker ID integration

### Setup
1. The Google Maps API key is pre-configured
2. On first run, existing riders' locations will be initialized
3. New riders automatically get location tracking enabled

### API Features Enabled
- Maps JavaScript API
- Geocoding API (for future enhancements)
- Places API (for address autocomplete)
- Directions API (for route planning)

## 💾 Database Structure

### Collections
- `users` - User authentication and roles
- `riders` - Rider information and status
- `expenses` - Expense records and receipts
- `documents` - Rider documents and certificates
- `bikeLocations` - Real-time GPS locations
- `deliveries` - Delivery history
- `budgets` - Monthly budget allocations
- `notifications` - System notifications

## 🔒 Security

- Firebase Authentication for user management
- Role-based access control at UI and database level
- Secure file uploads to Firebase Storage
- API key domain restrictions (configure in production)

## 📱 Features by Role

### Admin Dashboard
- Full system overview
- User management
- System configuration
- All reports access

### Operations Portal
- Rider management
- Expense recording
- Document verification
- Fleet tracking

### Finance Portal
- Expense approvals
- Budget management
- Financial reports
- Read-only fleet tracking

### Rider Portal
- Personal dashboard
- Document uploads
- Expense history
- Own location tracking

## 🚀 Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy
```

### Environment Setup
1. Configure Firebase project
2. Enable required APIs
3. Set up authentication methods
4. Deploy security rules
5. Configure domain (optional)

## 🧪 Testing

- Run development server: `npm run dev`
- Build for production: `npm run build`
- Preview production build: `npm run preview`

## 📈 Future Enhancements

- [ ] Mobile app for riders
- [ ] Advanced route optimization
- [ ] Predictive maintenance
- [ ] Integration with delivery platforms
- [ ] Advanced analytics dashboard
- [ ] Automated expense categorization
- [ ] Multi-language support

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Check the [Google Maps Setup Guide](./GOOGLE_MAPS_SETUP.md)
- Review Firebase console for errors
- Check browser console for client-side issues

---

Built with ❤️ for Yellow Box Dubai