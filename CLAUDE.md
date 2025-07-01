# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YellowBox is a delivery rider management system built with React/TypeScript that handles rider onboarding, expense tracking, document management, and bike tracking. The application serves multiple user roles (Admin, Operations, Finance, Rider-Applicant) with Firebase as the backend.

## Tech Stack & Key Dependencies

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui components + Tailwind CSS + Radix UI primitives
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **State Management**: React Context + TanStack Query
- **Routing**: React Router v6
- **Maps**: Google Maps API via @react-google-maps/api
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts

## Development Commands

```bash
# Install dependencies (handle peer dependency conflicts)
npm install --legacy-peer-deps

# Start development server
npm run dev

# Build for production
npm run build

# Build for development
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

**Important**: Use `--legacy-peer-deps` flag when installing due to date-fns version conflicts with react-day-picker.

## Architecture & Key Concepts

### Authentication & Authorization

The app uses Firebase Auth with custom user roles stored in Firestore. The authentication flow:

1. `AuthProvider` (src/hooks/use-auth.tsx) wraps the app and manages auth state
2. `RequireAuth` component protects routes and handles redirects
3. User roles: Admin, Operations, Finance, Rider-Applicant
4. Role-based access control via helper functions in auth-utils.ts

### Data Layer Architecture

**Firebase Integration:**
- `src/config/firebase.ts` - Firebase initialization and configuration
- `src/config/firestore-schema.ts` - Firestore collection names and document interfaces
- Service files in `src/services/` handle all Firebase operations

**Collections:**
- `users` - User profiles with roles
- `riders` - Rider information and application status
- `documents` - Document uploads linked to riders
- `expenses` - Expense tracking with approval workflow
- `budgets` - Monthly budget allocations
- `bikes` - Bike inventory and GPS tracking
- `notifications` - System notifications

### Component Architecture

Components are organized by feature domains:
- `components/auth/` - Authentication forms and guards
- `components/dashboard/` - Dashboard views by role
- `components/riders/` - Rider management UI
- `components/documents/` - Document upload/management
- `components/bike-tracker/` - Live GPS tracking
- `components/expenses/` - Expense management
- `components/settings/` - App configuration

### State Management Patterns

1. **Global Auth State**: React Context via AuthProvider
2. **Server State**: TanStack Query for Firebase data fetching
3. **Form State**: React Hook Form with Zod validation
4. **UI State**: Local component state + custom hooks

### Routing Structure

All routes except `/login` are protected by `RequireAuth`:
- `/` - Dashboard (role-specific content)
- `/riders` - Rider listing and management
- `/riders/:riderId` - Individual rider details
- `/expenses` - Expense tracking
- `/visas` - Visa cost management
- `/bike-tracker` - Live GPS tracking
- `/documents` - Document management
- `/settings` - Application settings
- `/profile` - User profile

## Firebase Configuration

Firebase credentials are hardcoded in `src/config/firebase.ts`. The project uses:
- **Project ID**: yellowbox-8e0e6
- **Auth Domain**: yellowbox-8e0e6.firebaseapp.com
- **Storage Bucket**: yellowbox-8e0e6.appspot.com

Security rules are defined in `firestore.rules` at project root.

## Development Patterns

### Service Layer Pattern
All Firebase operations go through service files:
- `riderFirestoreService.ts` - Rider CRUD operations
- `expenseFirestoreService.ts` - Expense management
- `documentService.ts` - File upload/download
- `bikeService.ts` - Bike tracking operations

### Error Handling
- Toast notifications via Sonner for user feedback
- Console logging for development debugging
- Firestore security rules handle authorization

### Mock Data Support
Development includes mock data generators in `src/data/` for testing without Firebase:
- `mockRiders.ts`, `mockExpenses.ts`, `mockBikes.ts`, etc.
- Switch between mock and live data via environment or feature flags

## Key Integrations

### Google Maps
- Live bike tracking with real-time location updates
- Google Maps API key required for map functionality
- Custom hooks: `use-google-maps-api.tsx`

### File Upload/Storage
- Firebase Storage for document uploads
- Support for images, PDFs, and other document types
- Document preview and download functionality

### Role-Based Features
- **Admin**: Full system access, user management
- **Operations**: Rider management, bike tracking
- **Finance**: Expense approval, budget management  
- **Rider-Applicant**: Limited access to personal profile/documents

## Deployment

The project is configured for Lovable.dev deployment but can be deployed anywhere that supports static sites:
- Build output: `dist/` directory
- Environment variables: Configure Firebase credentials for production
- Vite config optimized for production builds with code splitting

## Common Development Tasks

When adding new features:
1. Define TypeScript interfaces in `src/types/index.ts`
2. Add Firestore schema to `firestore-schema.ts` 
3. Create service functions for data operations
4. Build UI components following shadcn/ui patterns
5. Add routes to App.tsx with RequireAuth wrapper
6. Update role-based access controls as needed

When working with forms:
- Use React Hook Form + Zod for validation
- Follow existing form patterns in auth components
- Handle loading/error states consistently

When adding Firebase operations:
- Use appropriate service layer functions
- Handle Firestore security rule implications
- Test with both authenticated and unauthenticated states