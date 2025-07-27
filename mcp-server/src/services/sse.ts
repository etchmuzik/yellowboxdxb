/**
 * Server-Sent Events Service
 * Handles one-way real-time communication for dashboards and monitoring
 */

import { Response } from 'express';
import { EventRouter } from './eventRouter';
import { FleetEvent, EventType, AuthContext } from '../types';
import { logger } from '../utils/logger';
import { config } from '../config';

interface SSEClient {
  id: string;
  response: Response;
  userId: string;
  role: string;
  subscriptions: string[];
  lastActivity: Date;
}

export class SSEService {
  private clients: Map<string, SSEClient> = new Map();
  private eventRouter: EventRouter;
  private keepAliveInterval: NodeJS.Timeout;

  constructor(eventRouter: EventRouter) {
    this.eventRouter = eventRouter;
    this.startKeepAlive();
    this.cleanupInactiveClients();
  }

  /**
   * Add SSE client
   */
  addClient(
    clientId: string,
    response: Response,
    authContext: AuthContext,
    eventTypes?: EventType[]
  ): void {
    // Check max connections
    if (this.clients.size >= config.sse.maxConnections) {
      response.status(503).json({ error: 'Maximum connections reached' });
      return;
    }

    // Setup SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // Send initial connection event
    this.sendEvent(response, {
      type: 'connected',
      data: {
        clientId,
        userId: authContext.userId,
        role: authContext.role
      }
    });

    // Create client record
    const client: SSEClient = {
      id: clientId,
      response,
      userId: authContext.userId,
      role: authContext.role,
      subscriptions: [],
      lastActivity: new Date()
    };

    // Store client
    this.clients.set(clientId, client);

    // Subscribe to events
    if (eventTypes && eventTypes.length > 0) {
      this.subscribeClient(clientId, eventTypes);
    } else {
      // Auto-subscribe based on role
      this.autoSubscribeByRole(client);
    }

    // Handle client disconnect
    response.on('close', () => {
      this.removeClient(clientId);
    });

    logger.info(`SSE client connected: ${clientId} (${authContext.email})`);
  }

  /**
   * Remove SSE client
   */
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    
    if (client) {
      // Unsubscribe from all events
      client.subscriptions.forEach(subscriptionId => {
        this.eventRouter.unsubscribe(subscriptionId);
      });

      // Remove client
      this.clients.delete(clientId);
      
      logger.info(`SSE client disconnected: ${clientId}`);
    }
  }

  /**
   * Subscribe client to events
   */
  private subscribeClient(clientId: string, eventTypes: EventType[]): void {
    const client = this.clients.get(clientId);
    
    if (!client) {
      return;
    }

    eventTypes.forEach(eventType => {
      const subscriptionId = this.eventRouter.subscribe(
        client.userId,
        [eventType],
        'sse'
      );

      // Listen for events
      this.eventRouter.on(`event:${subscriptionId}`, (event: FleetEvent) => {
        this.sendEventToClient(client, event);
      });

      client.subscriptions.push(subscriptionId);
    });
  }

  /**
   * Auto-subscribe based on role
   */
  private autoSubscribeByRole(client: SSEClient): void {
    let eventTypes: EventType[] = [];

    switch (client.role) {
      case 'Admin':
        eventTypes = [
          'rider_location',
          'expense_submitted',
          'expense_updated',
          'document_uploaded',
          'document_verified',
          'bike_status',
          'system_alert',
          'fleet_alert',
          'budget_alert'
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
        // Limited events for riders
        eventTypes = ['expense_updated', 'document_verified'];
        break;
    }

    this.subscribeClient(client.id, eventTypes);
  }

  /**
   * Send event to specific client
   */
  private sendEventToClient(client: SSEClient, event: FleetEvent): void {
    try {
      this.sendEvent(client.response, {
        type: 'event',
        data: event
      });
      
      client.lastActivity = new Date();
    } catch (error) {
      logger.error(`Failed to send event to SSE client ${client.id}:`, error);
      this.removeClient(client.id);
    }
  }

  /**
   * Send SSE event
   */
  private sendEvent(response: Response, event: any): void {
    const data = JSON.stringify(event);
    response.write(`data: ${data}\n\n`);
  }

  /**
   * Broadcast to all clients matching criteria
   */
  broadcast(event: FleetEvent, filter?: { role?: string; userId?: string }): void {
    this.clients.forEach(client => {
      if (filter) {
        if (filter.role && client.role !== filter.role) return;
        if (filter.userId && client.userId !== filter.userId) return;
      }

      this.sendEventToClient(client, event);
    });
  }

  /**
   * Send dashboard metrics stream
   */
  streamDashboardMetrics(clientId: string, metrics: any): void {
    const client = this.clients.get(clientId);
    
    if (client) {
      this.sendEvent(client.response, {
        type: 'dashboard_metrics',
        data: metrics
      });
    }
  }

  /**
   * Send fleet alerts stream
   */
  streamFleetAlerts(clientId: string, alert: any): void {
    const client = this.clients.get(clientId);
    
    if (client) {
      this.sendEvent(client.response, {
        type: 'fleet_alert',
        data: alert
      });
    }
  }

  /**
   * Send live map updates
   */
  streamMapUpdate(clientId: string, update: any): void {
    const client = this.clients.get(clientId);
    
    if (client) {
      this.sendEvent(client.response, {
        type: 'map_update',
        data: update
      });
    }
  }

  /**
   * Start keep-alive interval
   */
  private startKeepAlive(): void {
    this.keepAliveInterval = setInterval(() => {
      this.clients.forEach(client => {
        try {
          client.response.write(':keep-alive\n\n');
        } catch (error) {
          logger.error(`Keep-alive failed for client ${client.id}:`, error);
          this.removeClient(client.id);
        }
      });
    }, config.sse.keepAliveInterval);
  }

  /**
   * Cleanup inactive clients
   */
  private cleanupInactiveClients(): void {
    setInterval(() => {
      const now = Date.now();
      const maxInactivity = 5 * 60 * 1000; // 5 minutes

      this.clients.forEach(client => {
        if (now - client.lastActivity.getTime() > maxInactivity) {
          logger.info(`Removing inactive SSE client: ${client.id}`);
          this.removeClient(client.id);
        }
      });
    }, 60000); // Check every minute
  }

  /**
   * Get SSE metrics
   */
  getMetrics() {
    const roleDistribution: Record<string, number> = {};
    
    this.clients.forEach(client => {
      roleDistribution[client.role] = (roleDistribution[client.role] || 0) + 1;
    });

    return {
      totalClients: this.clients.size,
      roleDistribution,
      maxConnections: config.sse.maxConnections
    };
  }

  /**
   * Cleanup on shutdown
   */
  shutdown(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }

    // Close all client connections
    this.clients.forEach(client => {
      try {
        client.response.end();
      } catch (error) {
        // Ignore errors during shutdown
      }
    });

    this.clients.clear();
  }
}