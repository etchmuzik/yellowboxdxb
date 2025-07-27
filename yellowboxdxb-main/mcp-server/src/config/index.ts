import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Configuration schema
const configSchema = z.object({
  server: z.object({
    port: z.number().min(1).max(65535),
    nodeEnv: z.enum(['development', 'production', 'test']),
    url: z.string().url(),
  }),
  firebase: z.object({
    projectId: z.string().min(1),
    privateKey: z.string().min(1),
    clientEmail: z.string().email(),
  }),
  socketIO: z.object({
    path: z.string(),
    corsOrigin: z.array(z.string()),
  }),
  redis: z.object({
    host: z.string(),
    port: z.number(),
    password: z.string().optional(),
    db: z.number(),
  }),
  jwt: z.object({
    secret: z.string().min(32),
    expiresIn: z.string(),
  }),
  n8n: z.object({
    baseUrl: z.string().url(),
    webhookAuthToken: z.string(),
  }),
  monitoring: z.object({
    logLevel: z.enum(['error', 'warn', 'info', 'debug']),
    enableMetrics: z.boolean(),
    metricsPort: z.number(),
  }),
  rateLimiting: z.object({
    windowMs: z.number(),
    maxRequests: z.number(),
  }),
});

// Parse and validate configuration
const config = configSchema.parse({
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    url: process.env.SERVER_URL || 'http://localhost:3000',
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
  },
  socketIO: {
    path: process.env.SOCKET_IO_PATH || '/socket.io',
    corsOrigin: (process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:8080').split(','),
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  n8n: {
    baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
    webhookAuthToken: process.env.N8N_WEBHOOK_AUTH_TOKEN || '',
  },
  monitoring: {
    logLevel: (process.env.LOG_LEVEL || 'info') as any,
    enableMetrics: process.env.ENABLE_METRICS === 'true',
    metricsPort: parseInt(process.env.METRICS_PORT || '9090', 10),
  },
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
});

export default config;