import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import config from './config';
import logger from './utils/logger';
import FirebaseIntegration from './integrations/firebase';
import N8NIntegration from './integrations/n8n';
import MessageQueue from './queues/messageQueue';
import EventRouter from './events/eventRouter';
import AuthMiddleware, { AuthSocket } from './middleware/auth';
import { MCPEvent, EventType, SocketClient } from './types';

class MCPServer {
  private app: express.Application;
  private httpServer: any;
  private io: SocketIOServer;
  private firebase: FirebaseIntegration;
  private n8n: N8NIntegration;
  private messageQueue: MessageQueue;
  private eventRouter: EventRouter;
  private auth: AuthMiddleware;
  private clients: Map<string, SocketClient> = new Map();

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    
    // Initialize Socket.IO
    this.io = new SocketIOServer(this.httpServer, {
      path: config.socketIO.path,
      cors: {
        origin: config.socketIO.corsOrigin,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Initialize integrations
    this.firebase = new FirebaseIntegration();
    this.n8n = new N8NIntegration();
    this.messageQueue = new MessageQueue();
    this.eventRouter = new EventRouter(this.firebase, this.n8n, this.messageQueue);
    this.auth = new AuthMiddleware(this.firebase);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: config.socketIO.corsOrigin,
      credentials: true,
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimiting.windowMs,
      max: config.rateLimiting.maxRequests,
      message: 'Too many requests from this IP',
    });
    this.app.use('/api/', limiter);

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
      });
    });

    // Metrics endpoint
    if (config.monitoring.enableMetrics) {
      this.app.get('/metrics', async (req, res) => {
        const stats = await this.getSystemStats();
        res.json(stats);
      });
    }

    // API routes
    const apiRouter = express.Router();

    // Event submission endpoint
    apiRouter.post('/events', 
      this.auth.authenticate.bind(this.auth),
      async (req, res) => {
        try {
          const event: MCPEvent = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...req.body,
            timestamp: new Date(),
            userId: req.user?.uid,
          };

          await this.eventRouter.routeEvent(event, ['firebase', 'n8n']);
          res.json({ success: true, eventId: event.id });
        } catch (error: any) {
          logger.error('Failed to submit event:', error);
          res.status(500).json({ error: error.message });
        }
      }
    );

    // Webhook endpoints
    apiRouter.post('/webhooks/n8n/*', 
      this.auth.verifyWebhookSignature.bind(this.auth),
      async (req, res) => {
        try {
          const path = req.path.replace('/webhooks/n8n', '');
          const result = await this.n8n.processWebhookRequest(path, req.body);
          res.json(result);
        } catch (error: any) {
          logger.error('Webhook processing failed:', error);
          res.status(500).json({ error: error.message });
        }
      }
    );

    // Queue status endpoint
    apiRouter.get('/queues/status',
      this.auth.authenticate.bind(this.auth),
      this.auth.requireRole('admin'),
      async (req, res) => {
        const stats = await this.messageQueue.getQueueStats();
        res.json(stats);
      }
    );

    // Test connection endpoints
    apiRouter.get('/test/firebase',
      this.auth.authenticate.bind(this.auth),
      this.auth.requireRole('admin'),
      async (req, res) => {
        try {
          await this.firebase.writeEvent({
            id: 'test',
            type: EventType.SYSTEM_NOTIFICATION,
            source: 'system' as any,
            payload: { test: true },
            timestamp: new Date(),
          });
          res.json({ success: true });
        } catch (error: any) {
          res.status(500).json({ error: error.message });
        }
      }
    );

    apiRouter.get('/test/n8n',
      this.auth.authenticate.bind(this.auth),
      this.auth.requireRole('admin'),
      async (req, res) => {
        const connected = await this.n8n.testConnection();
        res.json({ connected });
      }
    );

    this.app.use('/api', apiRouter);

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });

    // Error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  private setupSocketIO(): void {
    // Authentication middleware
    this.io.use(this.auth.authenticateSocket.bind(this.auth));

    // Connection handler
    this.io.on('connection', (socket: AuthSocket) => {
      logger.info(`Client connected: ${socket.id}`, {
        user: socket.user?.email,
        role: socket.user?.role,
      });

      // Store client info
      if (socket.user) {
        this.clients.set(socket.id, {
          id: socket.id,
          user: socket.user,
          rooms: new Set(),
          connectedAt: new Date(),
        });

        // Join role-based room
        socket.join(`role:${socket.user.role}`);
        
        // Join user-specific room
        socket.join(`user:${socket.user.uid}`);

        // Handle rider-specific rooms
        if (socket.user.role === 'rider') {
          socket.join(`rider:${socket.user.uid}`);
        }
      }

      // Event handlers
      socket.on('subscribe', (rooms: string[]) => {
        rooms.forEach(room => {
          socket.join(room);
          const client = this.clients.get(socket.id);
          if (client) {
            client.rooms.add(room);
          }
        });
        socket.emit('subscribed', rooms);
      });

      socket.on('unsubscribe', (rooms: string[]) => {
        rooms.forEach(room => {
          socket.leave(room);
          const client = this.clients.get(socket.id);
          if (client) {
            client.rooms.delete(room);
          }
        });
        socket.emit('unsubscribed', rooms);
      });

      // Handle real-time location updates
      socket.on('location:update', async (data) => {
        if (socket.user?.role !== 'rider') {
          socket.emit('error', { message: 'Unauthorized' });
          return;
        }

        const event: MCPEvent = {
          id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: EventType.RIDER_LOCATION_UPDATE,
          source: 'webapp' as any,
          payload: {
            riderId: socket.user.uid,
            ...data,
          },
          timestamp: new Date(),
          userId: socket.user.uid,
        };

        await this.eventRouter.routeEvent(event, ['firebase', 'broadcast']);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
        this.clients.delete(socket.id);
      });
    });

    // Set up namespaces
    this.setupNamespaces();
  }

  private setupNamespaces(): void {
    // Admin namespace
    const adminNamespace = this.io.of('/admin');
    adminNamespace.use(this.auth.authenticateSocket.bind(this.auth));
    adminNamespace.use((socket: AuthSocket, next) => {
      if (socket.user?.role === 'admin') {
        next();
      } else {
        next(new Error('Unauthorized'));
      }
    });

    adminNamespace.on('connection', (socket) => {
      logger.info(`Admin connected: ${socket.id}`);
      
      socket.on('system:command', async (command) => {
        // Handle admin commands
        switch (command.type) {
          case 'pause-queues':
            await this.messageQueue.pauseAll();
            socket.emit('command:result', { success: true });
            break;
          case 'resume-queues':
            await this.messageQueue.resumeAll();
            socket.emit('command:result', { success: true });
            break;
          default:
            socket.emit('command:result', { error: 'Unknown command' });
        }
      });
    });

    // Tracking namespace for real-time location updates
    const trackingNamespace = this.io.of('/tracking');
    trackingNamespace.use(this.auth.authenticateSocket.bind(this.auth));
    
    trackingNamespace.on('connection', (socket) => {
      logger.info(`Tracking client connected: ${socket.id}`);
      socket.join('live-tracking');
    });
  }

  private setupEventHandlers(): void {
    // Handle broadcast events from event router
    this.eventRouter.on('broadcast', ({ room, event }: { room: string; event: MCPEvent }) => {
      this.io.to(room).emit('event', event);
      logger.debug(`Event broadcast to room ${room}: ${event.type}`);
    });

    // Handle notifications
    this.eventRouter.on('notify', ({ role, notification }: any) => {
      if (role) {
        this.io.to(`role:${role}`).emit('notification', notification);
      } else if (notification.userId) {
        this.io.to(`user:${notification.userId}`).emit('notification', notification);
      }
    });

    // Process events from queue
    this.messageQueue.processEvents(async (job) => {
      const event = job.data as MCPEvent;
      logger.debug(`Processing event from queue: ${event.type}`);
      
      // Event is already handled by event router
      // This is for retry logic and delayed processing
    });

    // Process notifications from queue
    this.messageQueue.processNotifications(async (job) => {
      const notification = job.data;
      await this.firebase.sendNotification(notification.userId, notification);
    });

    // Process webhooks from queue
    this.messageQueue.processWebhooks(async (job) => {
      const webhook = job.data;
      await this.n8n.sendEvent(webhook);
    });
  }

  private async getSystemStats(): Promise<any> {
    const queueStats = await this.messageQueue.getQueueStats();
    const eventStats = this.eventRouter.getEventStats();
    
    return {
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        clients: this.clients.size,
      },
      queues: queueStats,
      events: eventStats,
      timestamp: new Date(),
    };
  }

  async start(): Promise<void> {
    try {
      // Connect to Redis
      await this.messageQueue.connect();
      
      // Initialize Firebase
      await this.firebase.initialize();
      
      // Start HTTP server
      this.httpServer.listen(config.server.port, () => {
        logger.info(`MCP Server running on port ${config.server.port}`);
        logger.info(`Environment: ${config.server.nodeEnv}`);
        logger.info(`WebSocket path: ${config.socketIO.path}`);
      });

      // Set up graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown...`);
      
      // Stop accepting new connections
      this.httpServer.close();
      
      // Disconnect all clients
      this.io.disconnectSockets(true);
      
      // Shutdown message queue
      await this.messageQueue.shutdown();
      
      // Cleanup Firebase
      this.firebase.destroy();
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

// Start the server
const server = new MCPServer();
server.start().catch((error) => {
  logger.error('Failed to start MCP server:', error);
  process.exit(1);
});