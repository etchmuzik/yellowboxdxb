// Type definitions for MCP Server

export interface User {
  uid: string;
  email: string;
  role: 'admin' | 'operations' | 'finance' | 'rider';
  displayName?: string;
}

export interface SocketClient {
  id: string;
  user: User;
  rooms: Set<string>;
  connectedAt: Date;
}

export interface MCPEvent {
  id: string;
  type: EventType;
  source: EventSource;
  payload: any;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

export enum EventType {
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

export enum EventSource {
  FIREBASE = 'firebase',
  N8N = 'n8n',
  WEB_APP = 'webapp',
  API = 'api',
  SYSTEM = 'system',
}

export interface WebhookPayload {
  webhookId: string;
  event: string;
  data: any;
  timestamp: Date;
  signature?: string;
}

export interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  userId?: string;
  role?: string;
  data?: any;
}

export interface LocationUpdate {
  riderId: string;
  bikeId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
  timestamp: Date;
}

export interface QueueJob {
  id: string;
  type: string;
  data: any;
  attempts: number;
  createdAt: Date;
  processedAt?: Date;
  failedAt?: Date;
  error?: string;
}