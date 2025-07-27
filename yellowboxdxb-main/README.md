# Yellow Box - Fleet Management System 🚛

[![Deploy Status](https://img.shields.io/badge/deploy-live-success)](https://yellowbox-8e0e6.web.app)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

A comprehensive fleet management system designed for delivery riders in Dubai. Yellow Box streamlines rider lifecycle management, expense tracking, document verification, and real-time fleet monitoring.

## 🌟 Features

### Multi-Role Dashboard System
- **Admin Dashboard**: Complete system oversight, analytics, and rider management
- **Finance Dashboard**: Budget allocation, expense approval, and financial reporting
- **Operations Dashboard**: Document verification and training management
- **Rider Mobile App**: Expense submission, document upload, and delivery tracking

### Core Functionality
- 📱 **Progressive Web App (PWA)** - Install on any device
- 🗺️ **Real-time GPS Tracking** - Live fleet monitoring with Google Maps
- 💰 **Expense Management** - Submit, track, and approve expenses
- 📄 **Document Management** - Upload, verify, and track document expiry
- 📊 **Analytics & Reporting** - Comprehensive business insights
- 🔔 **Real-time Notifications** - Instant updates on important events
- 🌍 **Offline Support** - Continue working without internet connection

## 🚀 Live Demo

Visit the live application: [https://yellowbox-8e0e6.web.app](https://yellowbox-8e0e6.web.app)

### Demo Credentials
```
Admin:    admin@yellowbox.ae / Admin123!
Finance:  finance@yellowbox.ae / Finance123!
Rider:    rider@yellowbox.ae / Rider123!
```

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - UI library
- **TypeScript 5.5.3** - Type safety
- **Vite 5.4.1** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Router v6** - Routing
- **React Hook Form** - Form management
- **TanStack Query** - Server state management

### Backend & Services
- **Firebase Auth** - Authentication
- **Cloud Firestore** - Real-time database
- **Firebase Storage** - File storage
- **Firebase Hosting** - Web hosting
- **Google Maps API** - Location services

## 📦 Installation

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0
- Firebase CLI
- Google Maps API Key

### Setup Instructions

1. **Clone the repository**
```bash
git clone https://github.com/etchmuzik/yellowboxdxb.git
cd yellowboxdxb/yellowboxdxb-main
```

2. **Install dependencies**
```bash
npm install --legacy-peer-deps
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your Firebase and Google Maps credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

4. **Run development server**
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## 🏗️ Project Structure

```
yellowboxdxb-main/
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Base UI components (shadcn)
│   │   ├── dashboard/    # Dashboard components
│   │   ├── expenses/     # Expense management
│   │   ├── riders/       # Rider management
│   │   └── documents/    # Document handling
│   ├── pages/            # Route pages
│   ├── services/         # Firebase services
│   ├── hooks/            # Custom React hooks
│   ├── contexts/         # React contexts
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── .kiro/                # Project specifications
│   ├── specs/            # Feature specifications
│   ├── steering/         # Guidelines and standards
│   └── agent-hooks/      # Development automation
└── public/               # Static assets
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase
```bash
firebase deploy --only hosting
```

### Environment-specific Builds
```bash
# Development build
npm run build:dev

# Staging build
npm run build:staging

# Production build
npm run build
```

## 📱 Progressive Web App

Yellow Box is a PWA that can be installed on any device:

1. Visit the site on your mobile device
2. Click "Add to Home Screen" when prompted
3. The app will function like a native application

Features:
- Offline support with service workers
- Push notifications
- App-like experience
- Automatic updates

## 🧪 Testing

```bash
# Run ESLint
npm run lint

# Type checking
npx tsc --noEmit

# Run tests (when implemented)
npm test
```

## 🔐 Security

- Role-based access control (RBAC)
- Firebase Security Rules for data protection
- Environment variables for sensitive data
- Input validation and sanitization
- Secure file upload with type restrictions

## 📊 Key Features Breakdown

### Rider Lifecycle Management
1. **Application** - Multi-step onboarding
2. **Document Verification** - Upload and verify required documents
3. **Training** - Theory and road tests
4. **Medical** - Health clearance
5. **ID Issuance** - Official rider ID
6. **Activation** - Bike assignment and go-live

### Expense Management
- Receipt upload with OCR
- Categorized expenses (Fuel, Maintenance, etc.)
- Approval workflow
- Monthly budget tracking
- Export to accounting systems

### Real-time Tracking
- Live GPS location updates
- Route history and playback
- Geofencing for delivery zones
- Performance analytics
- Battery-optimized tracking

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Documentation

Comprehensive documentation is available in the `.kiro` directory:
- [Project Context](.kiro/steering/yellowbox-project-context.md)
- [Coding Standards](.kiro/steering/coding-standards.md)
- [Deployment Guide](.kiro/steering/deployment-guide.md)
- [API Documentation](.kiro/specs/)

## 🐛 Known Issues

- Date picker requires `--legacy-peer-deps` flag during installation
- Large bundle size (working on code splitting)
- Some ESLint warnings for type annotations

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Team

- **Etch EG** - Project Owner & Lead Developer
- Dubai-based development team

## 📞 Support

For support, email support@yellowbox.ae or create an issue in this repository.

---

Built with ❤️ in Dubai 🇦🇪