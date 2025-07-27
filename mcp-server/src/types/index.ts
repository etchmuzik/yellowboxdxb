/**
 * MCP Server Type Definitions
 */

// User roles from Yellow Box
export type UserRole = 'Admin' | 'Operations' | 'Finance' | 'Rider-Applicant' | 'Rider';

// Event types for fleet management
export type EventType = 
  | 'rider_location' 
  | 'expense_submitted' 
  | 'expense_updated'
  | 'document_uploaded' 
  | 'document_verified'
  | 'bike_status' 
  | 'bike_assigned'
  | 'system_alert'
  | 'fleet_alert'
  | 'budget_alert';

// Priority levels
export type Priority = 'low' | 'medium' | 'high' | 'critical';

// Base event interface
export interface FleetEvent {
  id: string;
  type: EventType;
  priority: Priority;
  payload: any;
  timestamp: Date;
  source: string;
  userId?: string;
  targetSubscribers?: string[];
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'auth' | 'subscribe' | 'unsubscribe' | 'event' | 'heartbeat' | 'error';
  id?: string;
  token?: string;
  userId?: string;
  role?: UserRole;
  eventTypes?: EventType[];
  filters?: Record<string, any>;
  payload?: any;
  error?: {
    code: number;
    message: string;
  };
}

// Authentication context
export interface AuthContext {
  userId: string;
  email: string;
  role: UserRole;
  authenticated: boolean;
  sessionId: string;
}

// Subscription management
export interface Subscription {
  id: string;
  userId: string;
  eventTypes: EventType[];
  filters?: Record<string, any>;
  channel: 'websocket' | 'sse' | 'webhook';
  createdAt: Date;
}

// Real-time data types
export interface RiderLocation {
  riderId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: Date;
  bikeId?: string;
}

export interface ExpenseUpdate {
  expenseId: string;
  riderId: string;
  status: 'pending' | 'approved' | 'rejected';
  amount: number;
  category: string;
  approvedBy?: string;
  rejectionReason?: string;
  timestamp: Date;
}

export interface DocumentUpdate {
  documentId: string;
  riderId: string;
  type: string;
  status: 'pending' | 'verified' | 'rejected';
  verifiedBy?: string;
  rejectionReason?: string;
  timestamp: Date;
}

export interface BikeUpdate {
  bikeId: string;
  riderId?: string;
  status: 'available' | 'assigned' | 'maintenance' | 'retired';
  location?: {
    latitude: number;
    longitude: number;
  };
  lastMaintenance?: Date;
  timestamp: Date;
}

export interface FleetAlert {
  id: string;
  type: 'maintenance' | 'geofence' | 'accident' | 'violation' | 'emergency';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  affectedEntities?: {
    riderIds?: string[];
    bikeIds?: string[];
  };
  timestamp: Date;
}

// N8N webhook payload
export interface N8NWebhookPayload {
  operation: string;
  data: any;
  timestamp: string;
  source: 'web-app' | 'mcp-server' | 'external';
  eventId: string;
  priority: Priority;
}

// Server configuration
export interface MCPServerConfig {
  server: {
    port: number;
    host: string;
    cors: {
      origins: string[];
      credentials: boolean;
    };
  };
  websocket: {
    port: number;
    heartbeatInterval: number;
    reconnectTimeout: number;
  };
  sse: {
    endpoint: string;
    maxConnections: number;
    keepAliveInterval: number;
  };
  eventRouting: {
    defaultPriority: Priority;
    retryAttempts: number;
    batchSize: number;
  };
  security: {
    authentication: 'firebase' | 'jwt' | 'api-key';
    rateLimiting: {
      windowMs: number;
      maxRequests: number;
    };
  };
}

// Health check response
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: Date;
  connections: {
    websocket: number;
    sse: number;
  };
  integrations: {
    firebase: 'connected' | 'disconnected' | 'error';
    n8n: 'connected' | 'disconnected' | 'error';
    redis: 'connected' | 'disconnected' | 'error';
  };
  metrics?: {
    eventsProcessed: number;
    averageLatency: number;
    errorRate: number;
  };
}