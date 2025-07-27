# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Yellow Box is a comprehensive fleet management system for delivery riders in Dubai. The project consists of:
- **Web Application**: React/TypeScript fleet management dashboard (main codebase in `yellowboxdxb-main/`)
- **N8N Integration**: Automated workflows for data sync to Google Sheets
- **MCP Server**: Real-time bidirectional communication server (in `mcp-server/`)
- **Firebase Backend**: Auth, Firestore, Storage, and Functions

## Project Structure

```
yellowbox/
├── yellowboxdxb-main/      # Main web application
│   ├── src/                # React source code
│   ├── functions/          # Firebase Cloud Functions
│   ├── scripts/            # Deployment and utility scripts
│   └── dist/               # Build output
├── mcp-server/             # Model Context Protocol server
│   ├── src/                # TypeScript MCP server
│   └── config/             # Server configurations
├── n8n-workflows/          # N8N workflow definitions
└── Various .md files       # Documentation and guides
```

## Development Commands

### Web Application (yellowboxdxb-main/)
```bash
cd yellowboxdxb-main
npm install --legacy-peer-deps  # Required due to date-fns conflicts
npm run dev                     # Start dev server on :8080
npm run build                   # Production build
npm run build:dev              # Development build
npm run lint                    # Run ESLint
npm run deploy:production      # Deploy to Firebase

# Data seeding and management
npm run seed-with-users        # Seed test data with users
npm run clear-test-data        # Clear test data safely
npm run fix-admin              # Fix admin user issues
```

### MCP Server
```bash
cd mcp-server
npm install
npm run dev                    # Start with nodemon
npm run build                  # TypeScript build
npm run start                  # Start production server
npm run docker:build          # Build Docker image
```

## Key Architecture Components

### 1. Web Application Stack
- **Frontend**: React 18.3.1 + TypeScript 5.5.3 + Vite 5.4.1
- **UI**: Tailwind CSS + shadcn/ui + Radix UI primitives
- **State**: React Context API + TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Maps**: @react-google-maps/api
- **PWA**: vite-plugin-pwa with offline support

### 2. Firebase Configuration
- **Project ID**: yellowbox-8e0e6
- **Auth Domain**: yellowbox-8e0e6.firebaseapp.com
- **Storage Bucket**: yellowbox-8e0e6.appspot.com
- **Functions Region**: us-central1

### 3. N8N Automation Layer
- **Server**: https://n8n.srv924607.hstgr.cloud
- **Webhook**: /webhook/yellowbox-sync
- **Workflows**: Real-time data sync, Google Sheets integration
- **Status**: Currently requires configuration (see N8N_WORKFLOW_STATUS_REPORT.md)

### 4. MCP Server Architecture
- **Purpose**: Real-time bidirectional communication
- **Technologies**: Socket.IO, Express, Firebase Admin SDK
- **Features**: WebSocket connections, Server-Sent Events, Event routing
- **Port**: 3001 (configurable)

## User Roles & Permissions

1. **Admin**: Full system access, analytics, user management, bootstrap mode
2. **Operations**: Rider verification, document management, bike tracking
3. **Finance**: Expense approval, budget allocation, financial reports
4. **Rider-Applicant**: Personal dashboard, expense submission, document upload

## Firebase Collections

- `users` - User profiles with roles
- `riders` - Rider profiles and lifecycle stages
- `rider_documents` - Document metadata and verification
- `expenses` - Expense tracking with approval workflow
- `bikes` - Fleet inventory and GPS tracking
- `locations` - Real-time GPS data
- `budgets` - Monthly budget allocations
- `notifications` - System notifications
- `security_events` - Audit logging
- `user_sessions` - Active session tracking
- `visa-management` - Visa status tracking

## Rider Lifecycle Stages

1. **Applied** → 2. **Documents Verified** → 3. **Theory Test** → 4. **Road Test** → 5. **Medical** → 6. **ID Issued** → 7. **Active**

## Critical Implementation Notes

### Bootstrap Mode
- Initial admin creation mode in Firestore rules
- Must be disabled after first admin is created
- Enable/disable via `scripts/toggle-bootstrap-mode.js`

### Known Issues
- **npm install**: Always use `--legacy-peer-deps` flag
- **N8N Workflow**: Currently not configured (needs import from COMPLETE_N8N_WORKFLOW.json)
- **Date-fns**: Version conflicts with react-day-picker

### Security Considerations
- Firestore security rules enforce RBAC
- API keys must be domain-restricted
- Enable Firebase App Check in production
- Regular security rule audits required

## Integration Points

### Webhook Service (webhookService.ts)
```typescript
// Triggers N8N workflows for data sync
triggerWebhookSync(type: string, id: string, action: string, data: any)
```

### MCP WebSocket Service (mcpWebSocketService.ts)
```typescript
// Real-time event subscriptions
onRiderLocationUpdate(callback)
onExpenseStatusChange(callback)
onDocumentVerification(callback)
onBikeStatusChange(callback)
```

## Deployment Process

1. **Build**: `npm run build:production`
2. **Deploy Rules**: `firebase deploy --only firestore:rules`
3. **Deploy Functions**: `firebase deploy --only functions`
4. **Deploy Hosting**: `firebase deploy --only hosting`
5. **Verify**: Run `scripts/verify-firebase-deployment.sh`

## Environment Variables

Required in `.env`:
```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GOOGLE_MAPS_API_KEY=
```

## Performance Optimizations

- Vite manual chunks for optimal code splitting
- Lazy loading for dashboard components
- React Query for server state caching
- PWA with intelligent caching strategies
- Terser minification with console removal in production

## Testing & Verification Scripts

- `test-webhook-connection.js` - Test N8N webhook connectivity
- `n8n-workflow-verification-test.js` - Verify workflow configuration
- `test-complete-integration.js` - End-to-end integration test
- `scripts/verify-firebase-deployment.sh` - Post-deployment verification