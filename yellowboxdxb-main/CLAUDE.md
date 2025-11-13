# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Yellow Box is a comprehensive fleet management system for delivery riders in Dubai. Originally built with Firebase, the application has been **migrated to Supabase** (95% complete as of Nov 2025). The system handles rider onboarding through a complete lifecycle, expense tracking with approval workflows, document management with verification, real-time GPS bike tracking, and role-based dashboards.

## Critical Migration Status

**UPDATED: November 13, 2025** - Migration **100% COMPLETE** ✅

**Current State**:
- **Primary Backend**: Supabase (PostgreSQL) - All core services AND real-time features migrated
- **Real-time**: Supabase Realtime channels (replacing Firebase onSnapshot)
- **Legacy Firebase**: Only for optional monitoring/analytics/automation
- **Adapter Pattern**: Maintained for backward compatibility
- **Build Status**: ✅ SUCCESS (Zero Errors)

The migration uses an adapter pattern where original service files (e.g., `riderService.ts`) now re-export Supabase implementations (e.g., `riderSupabaseService.ts`) to maintain backward compatibility with all 25+ components without code changes.

### Real-time Features Migrated
- ✅ **GPS Tracking** (`BikeTrackerService`) - Live bike location updates
- ✅ **Notifications** (`NotificationContext`) - Instant notification toasts
- ✅ **Operations Dashboard** (`useOperationsData`) - Live rider/bike/activity updates
- ✅ WebSocket-based, auto-reconnection, < 500ms latency

## Tech Stack

### Frontend
- **React 18.3.1** + **TypeScript 5.5.3** + **Vite 5.4.1**
- **UI**: shadcn/ui + Tailwind CSS + Radix UI primitives
- **State**: React Context + TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Maps**: @react-google-maps/api
- **PWA**: vite-plugin-pwa with Workbox

### Backend & Services
- **Supabase** (Primary): Auth, PostgreSQL database, Storage
- **Firebase** (Legacy): Some bundled code remains, being phased out
- **N8N**: Automation workflows (needs configuration)
- **MCP Server**: Real-time bidirectional communication (in `mcp-server/`)

## Development Commands

### Essential Commands
```bash
# Install dependencies (ALWAYS use --legacy-peer-deps flag)
npm install --legacy-peer-deps

# Development server (runs on port 8080)
npm run dev

# Production build
npm run build

# Environment-specific builds
npm run build:dev           # Development mode
npm run build:staging       # Staging environment
npm run build:production    # Production mode

# Linting
npm run lint

# Preview production build
npm run preview
```

### Data Management Scripts
```bash
# Seed test data with users
npm run seed-with-users

# Clear test data safely (preserves system data)
npm run clear-test-data

# Fix admin user issues
npm run fix-admin

# Toggle bootstrap mode for initial admin setup
node scripts/toggle-bootstrap-mode.js
```

### Integration Testing
```bash
# Test N8N webhook connectivity
npm run test-webhook

# Test webapp integration
npm run test-webapp-integration

# Test Google Sheets integration
npm run test-sheets

# Verify Firebase deployment
npm run verify:deployment
```

### Deployment Commands
```bash
# Deploy to Firebase hosting
npm run deploy:hosting

# Deploy specific environment
npm run deploy              # Development
npm run deploy:staging      # Staging
npm run deploy:production   # Production

# Deploy only Firestore rules
firebase deploy --only firestore:rules

# Deploy only functions
firebase deploy --only functions
```

## Architecture & Key Concepts

### Dual-Backend Architecture (Transition State)

**Supabase Services** (`src/services/supabase/`):
- `baseService.ts` - Generic CRUD operations base class
- `riderSupabaseService.ts` - Rider lifecycle management
- `expenseSupabaseService.ts` - Expense approval workflow
- `documentSupabaseService.ts` - Document verification + Supabase Storage
- `bikeSupabaseService.ts` - Bike tracking and GPS integration
- `budgetSupabaseService.ts` - Monthly budget tracking
- `notificationSupabaseService.ts` - User and role notifications

**Adapter Services** (`src/services/`):
Services like `riderService.ts`, `expenseService.ts`, etc. now re-export their Supabase counterparts, maintaining the same API for backward compatibility.

**Still Firebase**:
- `activityService.ts` - Activity logging (planned for migration)
- `webhookService.ts` - N8N webhook triggers (external integration)

### Authentication Flow

**Current (Supabase)**:
1. `use-supabase-auth.tsx` - Handles Supabase auth operations (login, register, logout)
2. `use-auth.tsx` - Main AuthProvider wrapping the app, now uses Supabase auth state
3. `RequireAuth` component - Route protection with role-based access
4. User roles: Admin, Operations, Finance, Rider-Applicant
5. Session persistence via localStorage
6. User profiles stored in Supabase `users` table

**Key Differences from Firebase**:
- User IDs: `user.uid` → `user.id` (UUID format)
- Timestamps: Firebase Timestamp objects → ISO 8601 strings
- Auth state: Supabase session-based vs Firebase observer-based

### Database Schema (Supabase PostgreSQL)

**Collections/Tables**:
- `users` - User profiles with roles (links to Supabase Auth)
- `riders` - Rider information and lifecycle stages
- `rider_documents` - Document metadata and verification status
- `expenses` - Expense tracking with approval workflow
- `bikes` - Bike inventory and GPS tracker linking
- `budgets` - Monthly budget allocations
- `notifications` - System notifications by user/role
- `activity_logs` - User action tracking
- `locations` - GPS tracking history
- `security_events` - Audit logging

**Naming Convention**: Database uses `snake_case` (PostgreSQL convention), TypeScript uses `camelCase` with conversion in service layer.

### Rider Lifecycle Stages

1. **Applied** - Initial application submitted
2. **Documents Verified** - All documents uploaded and verified
3. **Theory Test** - Theory test completed
4. **Road Test** - Practical test passed
5. **Medical** - Medical clearance obtained
6. **ID Issued** - Official rider ID generated
7. **Active** - Bike assigned, actively delivering

### Component Architecture

```
src/components/
├── ui/              # Base shadcn/ui components (Button, Input, Dialog, etc.)
├── dashboard/       # Role-specific dashboard components
├── riders/          # Rider management and onboarding
├── expenses/        # Expense submission and approval
├── documents/       # Document upload and verification
├── bike-tracker/    # Real-time GPS tracking with Google Maps
├── settings/        # Application configuration
└── auth/            # Authentication forms and guards
```

### State Management Patterns

1. **Global Auth State**: React Context via `AuthProvider`
2. **Server State**: TanStack Query for API data fetching and caching
3. **Form State**: React Hook Form with Zod validation schemas
4. **UI State**: Local component state + custom hooks
5. **Real-time Updates**: Supabase Realtime channels with WebSocket connections

### Routing Structure

All routes except `/login` are protected by `RequireAuth`:
- `/` - Dashboard (role-specific content)
- `/riders` - Rider listing and management
- `/riders/:riderId` - Individual rider details
- `/expenses` - Expense tracking and approval
- `/visas` - Visa cost management
- `/bike-tracker` - Live GPS tracking map
- `/documents` - Document management
- `/settings` - Application settings
- `/profile` - User profile management

## Configuration Files

### Environment Variables (.env)
```env
# Supabase (Primary Backend)
VITE_SUPABASE_URL=http://31.97.59.237:5557
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Firebase (Legacy - still in use for some features)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=yellowbox-8e0e6
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Google Maps
VITE_GOOGLE_MAPS_API_KEY=

# App Configuration
VITE_APP_NAME=Yellow Box Fleet Management
VITE_APP_VERSION=2.0.0
NODE_ENV=production
```

### Firebase Configuration
- **Project ID**: yellowbox-8e0e6
- **Auth Domain**: yellowbox-8e0e6.firebaseapp.com
- **Hosting Site**: yellowboxdxb
- **Rules**: `firestore.rules`, `storage.rules`
- **Indexes**: `firestore.indexes.json`

### Supabase Configuration
- **URL**: http://31.97.59.237:5557 (self-hosted)
- **Studio**: http://31.97.59.237:3005
- **Database**: PostgreSQL with 284 migrated records
- **Storage**: Buckets replacing Firebase Storage folders

## Build Configuration

### Vite Build Optimization
- **Minifier**: Terser with console.log removal in production
- **Manual Chunks**: Optimized code splitting strategy
  - React core, Firebase modules, Radix UI groups, Google Maps, Charts/PDF
  - Targeted chunk sizes to improve load performance
- **PWA**: Service worker with intelligent caching strategies
- **Bundle Size**: ~2.5 MB total (~700 KB gzipped)

### Important Build Notes
- **ALWAYS use `--legacy-peer-deps`** flag for npm install due to date-fns conflicts with react-day-picker
- Build output: `dist/` directory
- Development server runs on port **8080** (not 5173)
- Production builds drop console logs automatically

## Development Patterns

### Service Layer Pattern
All backend operations go through service files:
- Supabase services in `src/services/supabase/` for actual implementations
- Adapter services in `src/services/` for backward compatibility
- Generic `BaseSupabaseService` class provides common CRUD operations
- Type-safe operations with TypeScript interfaces
- Consistent error handling with `handleSupabaseError`

### Error Handling
- Toast notifications via Sonner for user-facing feedback
- Console logging for development debugging (stripped in production)
- Service layer throws typed errors
- Supabase RLS policies handle authorization at database level

### When Adding Features

**For Supabase-based features (recommended)**:
1. Define TypeScript interfaces in `src/types/supabase.ts`
2. Create or extend service in `src/services/supabase/`
3. Use `BaseSupabaseService` for common CRUD operations
4. For real-time features, implement Supabase Realtime channels (see patterns below)
5. Export from adapter file in `src/services/` if needed by legacy components
6. Build UI components following shadcn/ui patterns
7. Add routes to `App.tsx` with `RequireAuth` wrapper
8. Update RLS policies in Supabase Studio if needed

**For Firebase features (legacy)**:
- All core features migrated to Supabase ✅
- Firebase remains only for optional monitoring/analytics
- Consider migrating any remaining Firebase code to Supabase

### Supabase Realtime Pattern

```typescript
import { supabase } from '@/config/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

useEffect(() => {
  let channel: RealtimeChannel;

  // Initial data fetch
  const fetchData = async () => {
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('filter', value);

    if (!error) setData(data);
  };

  fetchData();

  // Real-time subscription
  channel = supabase
    .channel('channel-name')
    .on(
      'postgres_changes',
      {
        event: '*', // INSERT, UPDATE, DELETE, or *
        schema: 'public',
        table: 'table_name',
        filter: 'column=eq.value' // Optional filter
      },
      (payload) => {
        console.log('Change detected:', payload.eventType);
        fetchData(); // Re-fetch on change
      }
    )
    .subscribe();

  // Cleanup
  return () => {
    supabase.removeChannel(channel);
  };
}, [dependencies]);
```

### Form Development Pattern
```typescript
// Use React Hook Form + Zod
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  // ...
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});

// Handle loading/error states consistently
// Use toast for user feedback
```

## Key Integrations

### Google Maps Integration
- Live bike tracking with real-time GPS updates
- Custom markers for bike fleet
- Route visualization
- API key required in environment variables
- Custom hook: `use-google-maps-api.tsx`

### N8N Automation (Requires Configuration)
- **Server**: https://n8n.srv924607.hstgr.cloud
- **Webhook Endpoint**: /webhook/yellowbox-sync
- **Status**: Workflows need to be imported from `COMPLETE_N8N_WORKFLOW.json`
- **Purpose**: Sync data to Google Sheets, WhatsApp notifications
- Test with: `npm run test-webhook`

### MCP Server (Real-time Communication)
- **Location**: `mcp-server/` directory
- **Port**: 3001 (configurable)
- **Technologies**: Socket.IO, Express, Firebase Admin SDK
- **Features**: WebSocket connections, SSE, event routing
- **Status**: Architecture defined, needs deployment

## Deployment

### Firebase Hosting (Current Production)
```bash
npm run build
firebase deploy --only hosting
```
- **Live URL**: https://yellowbox-8e0e6.web.app
- **Custom Domain**: Can be configured
- **CDN**: Firebase CDN with optimized headers
- **Security Headers**: CSP, XSS protection, frame options configured

### Coolify Deployment (Supabase-based)
See `DEPLOYMENT_GUIDE.md` for complete instructions:
1. Access Coolify at http://31.97.59.237:8000
2. Create new application with Nixpacks or Dockerfile
3. Set environment variables (Supabase URL + keys)
4. Build: `npm install --legacy-peer-deps && npm run build`
5. Start: `npx serve -s dist -l 3000`

### Docker Deployment
```bash
docker build -t yellowbox-fleet .
docker run -p 3000:3000 yellowbox-fleet
```
- `Dockerfile` configured for production builds
- `.dockerignore` excludes unnecessary files
- Environment variables injected at runtime

## PWA Configuration

Yellow Box is a Progressive Web App:
- **Manifest**: Configured in `vite.config.ts`
- **Service Worker**: Workbox with caching strategies
- **Offline Support**: Essential pages cached
- **Install Prompt**: Native on mobile devices
- **Icon Sizes**: 192x192, 512x512, favicon
- **Theme**: Gold (#FFD700) and black

## Role-Based Access Control

### Admin Role
- Full system access
- User management and role assignment
- Analytics dashboard
- Bootstrap mode for initial setup
- All features unlocked

### Operations Role
- Rider verification and onboarding
- Document approval
- Training management
- Bike assignment
- GPS tracking

### Finance Role
- Expense approval/rejection
- Budget allocation
- Financial reports
- Payment processing

### Rider-Applicant Role
- Personal profile view
- Expense submission
- Document upload
- Delivery tracking
- Limited to own data

## Bootstrap Mode

Critical for initial admin setup:
- **Enable**: `node scripts/toggle-bootstrap-mode.js --enable`
- **Disable**: `node scripts/toggle-bootstrap-mode.js --disable`
- **Purpose**: Allows first admin creation without existing admin
- **Security**: MUST be disabled after initial admin is created
- **Location**: Firestore security rules function

## Known Issues & Gotchas

1. **npm install**: ALWAYS use `--legacy-peer-deps` flag
2. **date-fns conflict**: Version conflicts with react-day-picker (accepted trade-off)
3. **N8N Workflows**: Not currently configured, needs import from JSON
4. **Firebase Bundle**: ~390KB still included for optional monitoring/analytics (~120KB gzipped)
5. **Port Conflict**: Dev server uses 8080, avoid using this port for other services
6. **Supabase Realtime**: Enable replication for tables in Supabase Studio (Database → Replication)

## Testing & Verification

### Manual Testing Checklist
After deployment or major changes:
- [ ] Login with each role (Admin, Finance, Operations, Rider)
- [ ] View 142 riders in dashboard
- [ ] Create new rider through onboarding flow
- [ ] Submit expense and approve with Finance role
- [ ] Upload document and verify with Operations role
- [ ] Assign bike to rider
- [ ] View GPS tracking on map
- [ ] Check notifications appear correctly

### Scripts for Testing
- `test-webhook-connection.js` - Verify N8N connectivity
- `test-complete-integration.js` - End-to-end integration test
- `test-firebase-connection.js` - Firebase connectivity check
- `test-riders-data.js` - Verify rider data integrity
- `scripts/verify-firebase-deployment.sh` - Post-deployment verification

## Support Resources

- **Supabase Studio**: http://31.97.59.237:3005
- **Coolify Dashboard**: http://31.97.59.237:8000
- **N8N Server**: https://n8n.srv924607.hstgr.cloud
- **Production App**: https://yellowbox-8e0e6.web.app
- **Firebase Console**: https://console.firebase.google.com (yellowbox-8e0e6)
- **Documentation**: See various .md files in project root

## Common Troubleshooting

**Build fails**:
- Use `npm install --legacy-peer-deps`
- Clear node_modules and reinstall
- Verify Node.js version >= 18.0.0

**Can't login after migration**:
- Check Supabase is running at http://31.97.59.237:3005
- Verify `VITE_SUPABASE_URL` in environment
- Check browser console for CORS errors

**No data showing**:
- Verify 284 records exist in Supabase Studio
- Check RLS policies allow read access
- Inspect network tab for failed API calls

**GPS tracking not working**:
- Verify Google Maps API key is set
- Check API key restrictions in Google Cloud Console
- Ensure Maps JavaScript API is enabled

## Future Roadmap

1. **Optional: Complete Firebase Removal**
   - Remove Firebase packages (~390KB savings)
   - Migrate monitoring to Supabase or alternative
   - Migrate activity logging to Supabase
   - Use Supabase Edge Functions for automation

2. **N8N Automation**
   - Import and configure workflows
   - Set up Google Sheets sync
   - Enable WhatsApp notifications

3. **MCP Server Deployment**
   - Deploy real-time communication server
   - Integrate WebSocket events
   - Enable live GPS tracking

4. **Performance Optimizations**
   - Further code splitting
   - Image optimization
   - Lazy loading for dashboard components

5. **Advanced Features**
   - Mobile app (React Native)
   - Advanced analytics
   - Export to PDF/Excel
   - Multi-language support
