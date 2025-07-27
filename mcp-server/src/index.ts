/**
 * Yellow Box MCP Server
 * Main entry point for the Model Context Protocol server
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config, firebaseConfig } from './config';
import { logger } from './utils/logger';
import { initializeFirebase } from './services/firebase';
import { WebSocketService } from './services/websocket';
import { SSEService } from './services/sse';
import { EventRouter } from './services/eventRouter';
import { N8NIntegration } from './services/n8n';
import { healthRouter } from './routes/health';
import { eventsRouter } from './routes/events';
import { sseRouter } from './routes/sse';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.server.cors.origins,
    credentials: config.server.cors.credentials
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: config.server.cors.origins,
  credentials: config.server.cors.credentials
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Initialize services
async function initializeServices() {
  try {
    // Initialize Firebase Admin SDK
    logger.info('🔥 Initializing Firebase...');
    await initializeFirebase(firebaseConfig);
    
    // Initialize Event Router
    logger.info('🔀 Initializing Event Router...');
    const eventRouter = new EventRouter();
    
    // Initialize N8N Integration
    logger.info('🔗 Initializing N8N Integration...');
    const n8nIntegration = new N8NIntegration(eventRouter);
    
    // Initialize WebSocket Service
    logger.info('🔌 Initializing WebSocket Service...');
    const wsService = new WebSocketService(io, eventRouter);
    
    // Initialize SSE Service
    logger.info('📡 Initializing SSE Service...');
    const sseService = new SSEService(eventRouter);
    
    // Make services available to routes
    app.locals.eventRouter = eventRouter;
    app.locals.wsService = wsService;
    app.locals.sseService = sseService;
    app.locals.n8nIntegration = n8nIntegration;
    
    logger.info('✅ All services initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
}

// Routes
app.use('/api/health', healthRouter);
app.use('/api/events', eventsRouter);
app.use('/sse', sseRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Yellow Box MCP Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      events: '/api/events',
      sse: '/sse/*',
      websocket: 'ws://localhost:3001'
    }
  });
});

// Error handling
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    await initializeServices();
    
    httpServer.listen(config.server.port, config.server.host, () => {
      logger.info(`🚀 MCP Server running at http://${config.server.host}:${config.server.port}`);
      logger.info(`🔌 WebSocket server ready at ws://${config.server.host}:${config.websocket.port}`);
      logger.info(`📡 SSE endpoint available at ${config.sse.endpoint}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('📛 SIGTERM signal received. Closing HTTP server...');
  httpServer.close(() => {
    logger.info('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('📛 SIGINT signal received. Closing HTTP server...');
  httpServer.close(() => {
    logger.info('✅ HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();