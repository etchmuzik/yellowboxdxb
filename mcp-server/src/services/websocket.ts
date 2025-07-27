/**
 * WebSocket Service
 * Handles real-time bidirectional communication with clients
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyIdToken, getUserById } from './firebase';
import { EventRouter } from './eventRouter';
import { WebSocketMessage, AuthContext, FleetEvent, EventType } from '../types';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class WebSocketService {
  private io: SocketIOServer;
  private eventRouter: EventRouter;
  private connectedClients: Map<string, AuthContext> = new Map();
  private socketSubscriptions: Map<string, string[]> = new Map();

  constructor(io: SocketIOServer, eventRouter: EventRouter) {
    this.io = io;
    this.eventRouter = eventRouter;
    this.setupSocketHandlers();
    this.startHeartbeat();
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info(`🔌 New WebSocket connection: ${socket.id}`);

      // Handle authentication
      socket.on('auth', async (message: WebSocketMessage) => {
        await this.handleAuth(socket, message);
      });

      // Handle subscription
      socket.on('subscribe', async (message: WebSocketMessage) => {
        await this.handleSubscribe(socket, message);
      });

      // Handle unsubscription
      socket.on('unsubscribe', async (message: WebSocketMessage) => {
        await this.handleUnsubscribe(socket, message);
      });

      // Handle incoming events
      socket.on('event', async (message: WebSocketMessage) => {
        await this.handleEvent(socket, message);
      });

      // Handle heartbeat
      socket.on('heartbeat', () => {
        socket.emit('heartbeat', { timestamp: new Date().toISOString() });
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  /**
   * Handle authentication
   */
  private async handleAuth(socket: Socket, message: WebSocketMessage): Promise<void> {
    try {
      if (!message.token) {
        throw new Error('No authentication token provided');
      }

      // Verify Firebase token
      const decodedToken = await verifyIdToken(message.token);
      const user = await getUserById(decodedToken.uid);

      // Create auth context
      const authContext: AuthContext = {
        userId: decodedToken.uid,
        email: decodedToken.email || '',
        role: user.role,
        authenticated: true,
        sessionId: uuidv4()
      };

      // Store auth context
      this.connectedClients.set(socket.id, authContext);

      // Join role-based room
      socket.join(`role:${user.role}`);
      socket.join(`user:${decodedToken.uid}`);

      // Send success response
      socket.emit('auth:success', {
        userId: authContext.userId,
        role: authContext.role,
        sessionId: authContext.sessionId
      });

      logger.info(`✅ Authenticated socket ${socket.id} as ${user.role} (${decodedToken.email})`);

      // Auto-subscribe based on role
      await this.autoSubscribeByRole(socket, authContext);

    } catch (error: any) {
      logger.error(`Authentication failed for socket ${socket.id}:`, error);
      socket.emit('auth:error', {
        code: 401,
        message: error.message || 'Authentication failed'
      });
      socket.disconnect();
    }
  }

  /**
   * Handle event subscription
   */
  private async handleSubscribe(socket: Socket, message: WebSocketMessage): Promise<void> {
    const authContext = this.connectedClients.get(socket.id);
    
    if (!authContext) {
      socket.emit('error', {
        code: 401,
        message: 'Not authenticated'
      });
      return;
    }

    try {
      const eventTypes = message.eventTypes || [];
      const filters = message.filters;

      // Create subscription in event router
      const subscriptionId = this.eventRouter.subscribe(
        authContext.userId,
        eventTypes as EventType[],
        'websocket',
        filters
      );

      // Track subscription for this socket
      const socketSubs = this.socketSubscriptions.get(socket.id) || [];
      socketSubs.push(subscriptionId);
      this.socketSubscriptions.set(socket.id, socketSubs);

      // Listen for events on this subscription
      this.eventRouter.on(`event:${subscriptionId}`, (event: FleetEvent) => {
        socket.emit('event', {
          subscriptionId,
          event
        });
      });

      // Send success response
      socket.emit('subscribe:success', {
        subscriptionId,
        eventTypes
      });

      logger.info(`Socket ${socket.id} subscribed to ${eventTypes.join(', ')}`);

    } catch (error: any) {
      logger.error(`Subscription failed for socket ${socket.id}:`, error);
      socket.emit('subscribe:error', {
        code: 500,
        message: error.message || 'Subscription failed'
      });
    }
  }

  /**
   * Handle unsubscription
   */
  private async handleUnsubscribe(socket: Socket, message: WebSocketMessage): Promise<void> {
    const authContext = this.connectedClients.get(socket.id);
    
    if (!authContext) {
      socket.emit('error', {
        code: 401,
        message: 'Not authenticated'
      });
      return;
    }

    try {
      const subscriptionId = message.id;
      
      if (!subscriptionId) {
        throw new Error('No subscription ID provided');
      }

      // Unsubscribe from event router
      const unsubscribed = this.eventRouter.unsubscribe(subscriptionId);

      if (unsubscribed) {
        // Remove from socket subscriptions
        const socketSubs = this.socketSubscriptions.get(socket.id) || [];
        const filtered = socketSubs.filter(id => id !== subscriptionId);
        this.socketSubscriptions.set(socket.id, filtered);

        socket.emit('unsubscribe:success', { subscriptionId });
      } else {
        socket.emit('unsubscribe:error', {
          code: 404,
          message: 'Subscription not found'
        });
      }

    } catch (error: any) {
      logger.error(`Unsubscribe failed for socket ${socket.id}:`, error);
      socket.emit('unsubscribe:error', {
        code: 500,
        message: error.message || 'Unsubscribe failed'
      });
    }
  }

  /**
   * Handle incoming events from clients
   */
  private async handleEvent(socket: Socket, message: WebSocketMessage): Promise<void> {
    const authContext = this.connectedClients.get(socket.id);
    
    if (!authContext) {
      socket.emit('error', {
        code: 401,
        message: 'Not authenticated'
      });
      return;
    }

    try {
      if (!message.payload) {
        throw new Error('No event payload provided');
      }

      // Create fleet event
      const event: FleetEvent = {
        id: uuidv4(),
        type: message.payload.type,
        priority: message.payload.priority || 'medium',
        payload: message.payload.data,
        timestamp: new Date(),
        source: `websocket:${authContext.userId}`,
        userId: authContext.userId
      };

      // Route the event
      await this.eventRouter.routeEvent(event);

      // Send acknowledgment
      socket.emit('event:ack', {
        eventId: event.id,
        status: 'accepted'
      });

    } catch (error: any) {
      logger.error(`Event handling failed for socket ${socket.id}:`, error);
      socket.emit('event:error', {
        code: 500,
        message: error.message || 'Event processing failed'
      });
    }
  }

  /**
   * Handle socket disconnect
   */
  private handleDisconnect(socket: Socket): void {
    logger.info(`🔌 Socket disconnected: ${socket.id}`);

    // Clean up subscriptions
    const socketSubs = this.socketSubscriptions.get(socket.id) || [];
    socketSubs.forEach(subscriptionId => {
      this.eventRouter.unsubscribe(subscriptionId);
    });

    // Clean up maps
    this.connectedClients.delete(socket.id);
    this.socketSubscriptions.delete(socket.id);
  }

  /**
   * Auto-subscribe based on user role
   */
  private async autoSubscribeByRole(socket: Socket, authContext: AuthContext): Promise<void> {
    let eventTypes: EventType[] = [];

    switch (authContext.role) {
      case 'Admin':
        eventTypes = [
          'rider_location',
          'expense_submitted',
          'expense_updated',
          'document_uploaded',
          'document_verified',
          'bike_status',
          'system_alert',
          'fleet_alert'
        ];
        break;

      case 'Operations':
        eventTypes = [
          'rider_location',
          'document_uploaded',
          'document_verified',
          'bike_status',
          'fleet_alert'
        ];
        break;

      case 'Finance':
        eventTypes = [
          'expense_submitted',
          'expense_updated',
          'budget_alert'
        ];
        break;

      case 'Rider':
      case 'Rider-Applicant':
        // Riders only get their own events
        eventTypes = ['expense_updated', 'document_verified', 'bike_assigned'];
        break;
    }

    if (eventTypes.length > 0) {
      await this.handleSubscribe(socket, {
        type: 'subscribe',
        eventTypes,
        filters: authContext.role === 'Rider' ? { riderId: authContext.userId } : undefined
      });
    }
  }

  /**
   * Broadcast event to specific rooms
   */
  broadcastToRole(role: string, event: FleetEvent): void {
    this.io.to(`role:${role}`).emit('event', event);
  }

  /**
   * Broadcast event to specific user
   */
  broadcastToUser(userId: string, event: FleetEvent): void {
    this.io.to(`user:${userId}`).emit('event', event);
  }

  /**
   * Start heartbeat interval
   */
  private startHeartbeat(): void {
    setInterval(() => {
      this.io.emit('heartbeat', {
        timestamp: new Date().toISOString(),
        connectedClients: this.connectedClients.size
      });
    }, 30000); // Every 30 seconds
  }

  /**
   * Get connection metrics
   */
  getMetrics() {
    return {
      connectedClients: this.connectedClients.size,
      totalSubscriptions: Array.from(this.socketSubscriptions.values())
        .reduce((sum, subs) => sum + subs.length, 0)
    };
  }
}