# Yellow Box MCP Server

Model Context Protocol (MCP) Server for Yellow Box Fleet Management System. Provides real-time bidirectional communication, event routing, and integration with N8N workflows.

## Features

- **WebSocket Support**: Real-time bidirectional communication
- **Server-Sent Events (SSE)**: Live dashboard updates
- **Event Routing**: Smart event distribution based on user roles
- **N8N Integration**: Seamless workflow automation
- **Firebase Integration**: Authentication and data synchronization
- **Redis Queue**: Reliable message delivery
- **Rate Limiting**: API protection
- **Health Monitoring**: Comprehensive health checks

## Quick Start

### Prerequisites

- Node.js 20+
- Redis (optional, for production)
- Firebase service account credentials
- N8N instance (optional)

### Installation

```bash
# Clone the repository
cd mcp-server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure environment variables
# Edit .env with your Firebase credentials and other settings
```

### Development

```bash
# Run in development mode
npm run dev

# Run with Docker Compose (includes Redis and N8N)
docker-compose up
```

### Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start

# Or use Docker
docker build -t yellowbox-mcp-server .
docker run -p 3001:3001 --env-file .env yellowbox-mcp-server
```

## API Endpoints

### Health Check
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed health with metrics
- `GET /api/health/live` - Kubernetes liveness probe
- `GET /api/health/ready` - Kubernetes readiness probe

### Events API
- `POST /api/events` - Submit event
- `POST /api/events/batch` - Batch event submission
- `POST /api/events/subscribe` - Create subscription
- `DELETE /api/events/subscribe/:id` - Remove subscription
- `GET /api/events/subscriptions` - List user subscriptions

### Server-Sent Events
- `GET /sse/dashboard?token=<token>` - Dashboard updates
- `GET /sse/fleet?token=<token>` - Fleet tracking
- `GET /sse/alerts?token=<token>` - System alerts
- `GET /sse/expenses?token=<token>` - Expense updates

### WebSocket
- `ws://localhost:3001` - WebSocket endpoint

## WebSocket Protocol

### Authentication
```json
{
  "type": "auth",
  "token": "firebase-auth-token"
}
```

### Subscribe to Events
```json
{
  "type": "subscribe",
  "eventTypes": ["rider_location", "expense_submitted"],
  "filters": {
    "riderId": "specific-rider-id"
  }
}
```

### Send Event
```json
{
  "type": "event",
  "payload": {
    "type": "rider_location",
    "data": {
      "latitude": 25.2048,
      "longitude": 55.2708
    }
  }
}
```

## Event Types

- `rider_location` - GPS location updates
- `expense_submitted` - New expense submission
- `expense_updated` - Expense status change
- `document_uploaded` - Document upload
- `document_verified` - Document verification
- `bike_status` - Bike status change
- `bike_assigned` - Bike assignment
- `system_alert` - System notifications
- `fleet_alert` - Fleet warnings
- `budget_alert` - Budget notifications

## Configuration

### Environment Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=localhost

# Firebase Configuration
FIREBASE_PROJECT_ID=yellowbox-8e0e6
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@yellowbox-8e0e6.iam.gserviceaccount.com

# N8N Integration
N8N_WEBHOOK_URL=http://localhost:5678/webhook/yellowbox-sync
N8N_API_KEY=your-n8n-api-key

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
JWT_SECRET=your-jwt-secret
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Web App    │────▶│ MCP Server  │────▶│    N8N      │
└─────────────┘     └─────────────┘     └─────────────┘
       │                    │                    │
       │                    ▼                    ▼
       │            ┌─────────────┐     ┌─────────────┐
       └───────────▶│  Firebase   │     │Google Sheets│
                    └─────────────┘     └─────────────┘
```

## Role-Based Event Routing

- **Admin**: All events
- **Operations**: Rider locations, documents, bikes, fleet alerts
- **Finance**: Expenses, budget alerts
- **Rider**: Own expenses and documents only

## Monitoring

### Metrics Available
- Connected WebSocket clients
- Active SSE connections
- Events processed per second
- Average event latency
- Error rates
- Firebase/N8N connection status

### Health Check Response
```json
{
  "status": "healthy",
  "uptime": 3600,
  "connections": {
    "websocket": 25,
    "sse": 10
  },
  "integrations": {
    "firebase": "connected",
    "n8n": "connected",
    "redis": "connected"
  },
  "metrics": {
    "eventsProcessed": 15000,
    "averageLatency": 45,
    "errorRate": 0.1
  }
}
```

## Deployment

### Docker Deployment
```bash
# Build image
docker build -t yellowbox-mcp-server .

# Run with environment file
docker run -d \
  --name mcp-server \
  -p 3001:3001 \
  --env-file .env \
  yellowbox-mcp-server
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mcp-server
  template:
    metadata:
      labels:
        app: mcp-server
    spec:
      containers:
      - name: mcp-server
        image: yellowbox-mcp-server:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /api/health/live
            port: 3001
        readinessProbe:
          httpGet:
            path: /api/health/ready
            port: 3001
```

## Troubleshooting

### Common Issues

1. **Firebase Authentication Errors**
   - Verify service account credentials
   - Check Firebase project ID
   - Ensure private key format is correct

2. **N8N Connection Failed**
   - Verify N8N webhook URL
   - Check network connectivity
   - Ensure N8N workflow is active

3. **WebSocket Connection Drops**
   - Check CORS configuration
   - Verify authentication token
   - Monitor network stability

4. **High Memory Usage**
   - Implement connection limits
   - Monitor event queue size
   - Check for memory leaks

## License

MIT