/**
 * MCP Server Configuration
 */

import dotenv from 'dotenv';
import { MCPServerConfig, Priority } from '../types';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Parse CORS origins
const corsOrigins = process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || ['http://localhost:5173'];

// Export configuration
export const config: MCPServerConfig = {
  server: {
    port: parseInt(process.env.PORT || '3001'),
    host: process.env.HOST || 'localhost',
    cors: {
      origins: corsOrigins,
      credentials: true
    }
  },
  websocket: {
    port: parseInt(process.env.WS_PORT || '3001'),
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000'),
    reconnectTimeout: parseInt(process.env.WS_RECONNECT_TIMEOUT || '5000')
  },
  sse: {
    endpoint: process.env.SSE_ENDPOINT || '/sse',
    maxConnections: parseInt(process.env.SSE_MAX_CONNECTIONS || '1000'),
    keepAliveInterval: parseInt(process.env.SSE_KEEPALIVE_INTERVAL || '30000')
  },
  eventRouting: {
    defaultPriority: (process.env.DEFAULT_EVENT_PRIORITY as Priority) || 'medium',
    retryAttempts: parseInt(process.env.EVENT_RETRY_ATTEMPTS || '3'),
    batchSize: parseInt(process.env.EVENT_BATCH_SIZE || '100')
  },
  security: {
    authentication: 'firebase',
    rateLimiting: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
    }
  }
};

// Firebase Admin SDK configuration
export const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID!,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n')
};

// N8N configuration
export const n8nConfig = {
  webhookUrl: process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/yellowbox-sync',
  apiKey: process.env.N8N_API_KEY
};

// Redis configuration
export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0')
};

// Logging configuration
export const loggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  file: process.env.LOG_FILE || 'mcp-server.log'
};

// Export environment
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';