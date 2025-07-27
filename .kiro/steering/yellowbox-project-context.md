# Yellow Box Project Context

## Project Overview
Yellow Box is a comprehensive driver expense and fleet management system for delivery operations in Dubai. It's built with React, TypeScript, Firebase, and includes real-time GPS tracking capabilities.

## Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + Shadcn/ui components
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Maps**: Google Maps API for real-time tracking
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6

## Key Business Domains

### 1. Rider Management
- Complete lifecycle from application to active status
- Application stages: Applied → Docs Verified → Theory Test → Road Test → Medical → ID Issued → Active
- Test status tracking (Theory, Road, Medical)
- Document management with expiry tracking

### 2. Expense Management
- Multi-category expense tracking (Visa Fees, RTA Tests, Medical, etc.)
- Receipt upload and storage
- Approval workflow system
- Budget monitoring and reporting

### 3. Fleet Tracking
- Real-time GPS tracking with Google Maps
- District-based location detection
- Speed and battery monitoring
- Interactive map with custom markers

### 4. Document Management
- Document upload and storage
- Expiry date tracking
- Status management (Valid, Expired, Required, Pending, Rejected)
- Document types: Visa, Driver License, Medical Certificate, Insurance, etc.

## User Roles & Permissions
- **Admin**: Full system access and user management
- **Operations**: Rider and expense management, document verification
- **Finance**: Financial data, expense approvals, budget management
- **Rider**: Self-service portal for personal data and documents

## Code Organization
- `/src/components/` - Organized by feature (auth, riders, expenses, etc.)
- `/src/services/` - Business logic and Firebase integration
- `/src/types/` - TypeScript type definitions
- `/src/hooks/` - Custom React hooks
- `/src/pages/` - Route components
- `/src/utils/` - Utility functions

## Development Guidelines
- Use TypeScript for all new code
- Follow React functional component patterns with hooks
- Use Shadcn/ui components for consistent UI
- Implement proper error handling and loading states
- Follow Firebase security rules and authentication patterns
- Use React Query for data fetching and caching