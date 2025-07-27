# Yellow Box MCP Server

Message Communication Protocol (MCP) server for the Yellow Box fleet management system. This server provides real-time WebSocket communication, event routing, message queuing, and seamless integration with Firebase and N8N automation workflows.

## Architecture Overview

The MCP server acts as the central nervous system for real-time communication in the Yellow Box ecosystem:

- **WebSocket Server**: Powered by Socket.IO for bidirectional real-time communication
- **Event Router**: Centralized event processing and routing system
- **Message Queue**: Redis-backed Bull queues for reliable message delivery
- **Firebase Integration**: Real-time listeners for Firestore changes
- **N8N Integration**: Webhook endpoints and workflow triggers

## Features

### Real-time Communication
- WebSocket connections with Socket.IO
- Role-based namespaces and rooms
- Automatic reconnection handling
- Presence detection and management

### Event Processing
- Centralized event validation and routing
- Event filtering and transformation
- Parallel event handler execution
- Event persistence and audit logging

### Message Queuing
- Reliable message delivery with Redis/Bull
- Retry logic with exponential backoff
- Dead letter queue for failed messages
- Priority-based processing

### Integrations
- **Firebase**: Real-time Firestore listeners, authentication, data sync
- **N8N**: Webhook processing, workflow triggers, automation
- **Yellow Box Web App**: Direct WebSocket integration

## Prerequisites

- Node.js 18+ and npm
- Redis server (for message queuing)
- Firebase project with service account
- N8N instance (optional, for automation)

## Installation

### Local Development

1. Clone the repository:
```bash
cd mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Firebase Configuration
FIREBASE_PROJECT_ID=yellowbox-8e0e6
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@yellowbox-8e0e6.iam.gserviceaccount.com

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=your-secret-key-min-32-chars

# N8N Configuration
N8N_BASE_URL=http://localhost:5678
N8N_WEBHOOK_AUTH_TOKEN=your-n8n-token
```

5. Start Redis:
```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or install locally
brew install redis && brew services start redis
```

6. Run the server:
```bash
npm run dev
```

### Docker Deployment

1. Build and run with Docker Compose:
```bash
docker-compose up -d
```

2. View logs:
```bash
docker-compose logs -f mcp-server
```

3. Stop services:
```bash
docker-compose down
```

## API Endpoints

### REST API

#### Health Check
```http
GET /health
```

#### Submit Event
```http
POST /api/events
Authorization: Bearer <token>

{
  "type": "rider:status:changed",
  "source": "webapp",
  "payload": {
    "riderId": "rider123",
    "status": "active"
  }
}
```

#### Queue Status (Admin only)
```http
GET /api/queues/status
Authorization: Bearer <token>
```

### WebSocket Events

#### Client to Server

```javascript
// Subscribe to rooms
socket.emit('subscribe', ['tracking', 'rider:123']);

// Send location update (riders only)
socket.emit('location:update', {
  bikeId: 'bike123',
  latitude: 25.2048,
  longitude: 55.2708,
  speed: 15.5
});
```

#### Server to Client

```javascript
// Receive events
socket.on('event', (event) => {
  console.log('Event received:', event);
});

// Receive notifications
socket.on('notification', (notification) => {
  console.log('Notification:', notification);
});
```

## Event Types

The MCP server handles the following event types:

- `rider:status:changed` - Rider status updates
- `rider:location:update` - Real-time location tracking
- `rider:document:uploaded` - Document upload notifications
- `rider:document:verified` - Document verification status
- `expense:submitted` - New expense submissions
- `expense:approved` - Expense approvals
- `expense:rejected` - Expense rejections
- `bike:assigned` - Bike assignments
- `bike:maintenance:required` - Maintenance alerts
- `bike:location:update` - Bike GPS updates
- `system:notification` - System-wide notifications
- `webhook:received` - Incoming webhook events

## Authentication

The MCP server supports two authentication methods:

1. **Firebase ID Tokens** (recommended)
   - Obtained from Firebase Auth in the web app
   - Automatically verified against Firebase

2. **JWT Tokens** (for testing/development)
   - Generated using the JWT secret
   - Contains user ID, email, and role

### Socket.IO Authentication

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-firebase-id-token-or-jwt'
  }
});
```

## Monitoring

### Metrics Endpoint
```http
GET /metrics
```

Returns server statistics including:
- Active connections
- Queue statistics
- Event processing metrics
- Memory usage

### Logging

Logs are written to:
- Console (with colors in development)
- `logs/error.log` - Error logs only
- `logs/combined.log` - All logs

## Production Deployment

### Google Cloud Run

1. Build container:
```bash
docker build -t gcr.io/yellowbox-8e0e6/mcp-server .
```

2. Push to registry:
```bash
docker push gcr.io/yellowbox-8e0e6/mcp-server
```

3. Deploy:
```bash
gcloud run deploy mcp-server \
  --image gcr.io/yellowbox-8e0e6/mcp-server \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production
```

### Environment Variables

Ensure all production environment variables are set:
- Use Google Secret Manager for sensitive values
- Configure Cloud Run environment variables
- Set up Cloud Memorystore for Redis

### Scaling Configuration

```yaml
# Cloud Run configuration
spec:
  containers:
  - image: gcr.io/yellowbox-8e0e6/mcp-server
    resources:
      limits:
        cpu: "2"
        memory: "2Gi"
  scaling:
    minInstances: 1
    maxInstances: 100
```

## Development

### Project Structure

```
mcp-server/
├── src/
│   ├── server.ts           # Main server entry point
│   ├── config/             # Configuration management
│   ├── events/             # Event router and handlers
│   ├── queues/             # Message queue implementation
│   ├── integrations/       # Firebase and N8N integrations
│   ├── middleware/         # Authentication and validation
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript type definitions
├── docker/                 # Additional Docker configs
├── logs/                   # Log files (git ignored)
├── tests/                  # Test files
└── package.json
```

### Adding New Event Types

1. Add to `EventType` enum in `src/types/index.ts`
2. Add validation schema in `src/events/eventRouter.ts`
3. Register handler in `EventRouter.registerDefaultHandlers()`
4. Update N8N webhook endpoint mapping

### Testing

Run tests:
```bash
npm test
```

Test WebSocket connection:
```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c ws://localhost:3000/socket.io/?EIO=4&transport=websocket
```

## Troubleshooting

### Redis Connection Issues
- Ensure Redis is running: `redis-cli ping`
- Check Redis connection settings in `.env`
- Verify firewall rules allow Redis port

### Firebase Authentication Errors
- Verify service account JSON is correct
- Check Firebase project ID matches
- Ensure service account has necessary permissions

### WebSocket Connection Failures
- Check CORS settings match client origin
- Verify authentication token is valid
- Check firewall/proxy WebSocket support

### Memory Issues
- Monitor queue sizes: `GET /api/queues/status`
- Implement queue cleanup: runs automatically
- Adjust Node.js memory limit if needed

## Security

- All REST endpoints require authentication
- WebSocket connections require valid tokens
- Role-based access control (RBAC)
- Rate limiting on API endpoints
- Webhook signature verification
- Input validation with Zod schemas

## Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review error messages in browser console
3. Verify all environment variables are set
4. Ensure all services (Redis, Firebase) are accessible