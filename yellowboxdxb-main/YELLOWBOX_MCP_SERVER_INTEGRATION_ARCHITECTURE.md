# Yellow Box MCP Server Integration Architecture

## Overview

The Message Communication Protocol (MCP) server serves as the real-time communication backbone for the Yellow Box fleet management system. It provides WebSocket-based real-time updates, event routing, message queuing, and seamless integration with Firebase and N8N automation workflows.

## Architecture Components

### 1. WebSocket Server (Socket.IO)

The WebSocket server provides bidirectional real-time communication between the Yellow Box web application and backend services.

**Key Features:**
- Multiple namespaces for role-based communication
- Room-based event broadcasting
- Automatic reconnection handling
- Authentication via Firebase ID tokens or JWT

**Namespaces:**
- `/` - Main namespace for authenticated users
- `/admin` - Admin-only namespace for system management
- `/tracking` - Real-time location tracking namespace

**Room Structure:**
- `role:{role}` - Role-based rooms (admin, operations, finance, rider)
- `user:{userId}` - User-specific rooms
- `rider:{riderId}` - Individual rider rooms
- `tracking` - Global tracking room
- `bike:{bikeId}` - Bike-specific rooms

### 2. Event Router

Central hub for processing and routing events throughout the system.

**Event Flow:**
1. Events received from various sources (Firebase, N8N, Web App)
2. Event validation using Zod schemas
3. Event filtering based on configured rules
4. Parallel execution of registered handlers
5. Event persistence and broadcasting

**Event Types:**
```typescript
enum EventType {
  // Rider Events
  RIDER_STATUS_CHANGED = 'rider:status:changed',
  RIDER_LOCATION_UPDATE = 'rider:location:update',
  RIDER_DOCUMENT_UPLOADED = 'rider:document:uploaded',
  RIDER_DOCUMENT_VERIFIED = 'rider:document:verified',
  
  // Expense Events
  EXPENSE_SUBMITTED = 'expense:submitted',
  EXPENSE_APPROVED = 'expense:approved',
  EXPENSE_REJECTED = 'expense:rejected',
  
  // Bike Events
  BIKE_ASSIGNED = 'bike:assigned',
  BIKE_MAINTENANCE_REQUIRED = 'bike:maintenance:required',
  BIKE_LOCATION_UPDATE = 'bike:location:update',
  
  // System Events
  SYSTEM_NOTIFICATION = 'system:notification',
  WEBHOOK_RECEIVED = 'webhook:received',
  DATA_SYNC_REQUIRED = 'data:sync:required',
}
```

### 3. Message Queue (Redis + Bull)

Provides reliable message delivery with retry mechanisms and priority handling.

**Queue Types:**
- **Event Queue**: Processes system events with retry logic
- **Notification Queue**: Handles user notifications
- **Webhook Queue**: Manages outbound webhook calls to N8N

**Queue Configuration:**
- Exponential backoff for retries
- Dead letter queue for failed messages
- Priority-based processing
- Automatic cleanup of old jobs

### 4. Firebase Integration

Real-time synchronization with Firestore database.

**Listeners:**
- `riders` collection - Status changes, profile updates
- `expenses` collection - New submissions, approvals, rejections
- `locations` collection - Real-time GPS updates
- `rider_documents` collection - Document uploads and verifications

**Operations:**
- Event persistence to `mcp_events` collection
- User authentication via Firebase Auth
- Notification delivery to `notifications` collection
- Real-time data synchronization

### 5. N8N Integration

Webhook-based integration for workflow automation.

**Webhook Endpoints:**
```
POST /api/webhooks/n8n/rider-status-changed
POST /api/webhooks/n8n/expense-submitted
POST /api/webhooks/n8n/expense-approved
POST /api/webhooks/n8n/bike-assigned
POST /api/webhooks/n8n/document-verified
```

**Workflow Triggers:**
- Rider onboarding automation
- Expense approval workflows
- Document verification processes
- Maintenance scheduling
- Alert notifications

## Data Flow Patterns

### 1. Real-time Location Updates

```
Rider App → WebSocket → MCP Server → Event Router
                                           ↓
                                    Firebase (persist)
                                           ↓
                                    Broadcast to tracking room
                                           ↓
                                    Admin Dashboard (live view)
```

### 2. Expense Submission Flow

```
Rider Submit → Firebase → MCP Listener → Event Router
                                              ↓
                                        Message Queue
                                              ↓
                                        N8N Webhook
                                              ↓
                                     Approval Workflow
                                              ↓
                                     Finance Dashboard
```

### 3. Document Verification Flow

```
Document Upload → Firebase → MCP Listener → Event Router
                                                 ↓
                                           Notification
                                                 ↓
                                        Operations Team
                                                 ↓
                                          Verification
                                                 ↓
                                        Status Update → N8N
```

## Security Architecture

### Authentication
- Firebase ID token verification for web clients
- JWT token support for service-to-service communication
- Role-based access control (RBAC)
- Webhook signature verification

### Authorization
- Role-based namespaces and rooms
- Event filtering based on user permissions
- API endpoint protection with middleware
- Rate limiting on all endpoints

### Data Protection
- TLS/SSL for all communications
- Input validation with Zod schemas
- SQL injection prevention
- XSS protection with helmet.js

## Deployment Architecture

### Local Development
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Web App   │────▶│ MCP Server  │────▶│    Redis    │
└─────────────┘     └─────────────┘     └─────────────┘
                            │
                            ├────────────▶ Firebase
                            │
                            └────────────▶ N8N
```

### Production (Google Cloud)
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Cloud CDN   │────▶│ Cloud Run   │────▶│MemoryStore │
└─────────────┘     │ (MCP Server)│     │   (Redis)   │
                    └─────────────┘     └─────────────┘
                            │
                            ├────────────▶ Firestore
                            │
                            └────────────▶ N8N Instance
```

### Scaling Strategy
- Horizontal scaling with Cloud Run
- Redis cluster for high availability
- Load balancing for WebSocket connections
- Auto-scaling based on CPU and memory usage

## Monitoring and Observability

### Metrics
- Active WebSocket connections
- Event processing rate
- Queue depths and processing times
- Error rates and types
- API response times

### Logging
- Structured logging with Winston
- Log aggregation in Google Cloud Logging
- Error tracking with stack traces
- Audit logging for compliance

### Health Checks
- `/health` endpoint for uptime monitoring
- Redis connection health
- Firebase connection status
- Queue processing health
- Memory and CPU usage

## Integration Points

### Web Application
```javascript
// WebSocket connection
const socket = io('https://mcp.yellowbox.com', {
  auth: { token: firebaseIdToken }
});

// Event listening
socket.on('event', (event) => {
  // Handle real-time updates
});
```

### N8N Workflows
```javascript
// Webhook node configuration
{
  "webhookUrl": "https://mcp.yellowbox.com/api/webhooks/n8n/expense-submitted",
  "method": "POST",
  "authentication": "Header Auth",
  "headerAuth": {
    "name": "X-Auth-Token",
    "value": "{{$credentials.mcpWebhookToken}}"
  }
}
```

### Firebase Functions
```javascript
// Trigger MCP events from Firebase Functions
exports.onRiderStatusChange = functions.firestore
  .document('riders/{riderId}')
  .onUpdate(async (change, context) => {
    await axios.post('https://mcp.yellowbox.com/api/events', {
      type: 'rider:status:changed',
      source: 'firebase-function',
      payload: {
        riderId: context.params.riderId,
        before: change.before.data(),
        after: change.after.data()
      }
    });
  });
```

## Performance Optimization

### Caching Strategy
- Redis caching for frequently accessed data
- WebSocket connection pooling
- Event deduplication
- Batch processing for bulk operations

### Resource Management
- Connection limits per client
- Memory usage monitoring
- Queue size limits
- Automatic cleanup routines

### Network Optimization
- WebSocket compression
- Event batching
- Selective field updates
- CDN for static assets

## Disaster Recovery

### Backup Strategy
- Event log persistence in Firestore
- Redis persistence with AOF
- Configuration backups
- Automated snapshots

### Failover Procedures
- Automatic Cloud Run instance replacement
- Redis sentinel for high availability
- Multi-region deployment option
- Graceful degradation

### Recovery Time Objectives
- RTO: < 5 minutes
- RPO: < 1 minute
- Automatic failover
- Zero-downtime deployments

## Future Enhancements

### Planned Features
1. GraphQL subscriptions support
2. Event sourcing implementation
3. CQRS pattern adoption
4. Multi-tenant architecture
5. Edge computing support

### Integration Roadmap
1. Slack/Teams notifications
2. SMS gateway integration
3. Push notification service
4. Analytics pipeline
5. Machine learning integration

### Performance Goals
1. < 100ms event processing latency
2. 10,000+ concurrent connections
3. 99.9% uptime SLA
4. < 50ms WebSocket latency
5. 1M+ events/day capacity