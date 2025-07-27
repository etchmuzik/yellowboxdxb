import { EventEmitter } from 'events';
import { z } from 'zod';
import logger from '../utils/logger';
import { MCPEvent, EventType, EventSource } from '../types';
import FirebaseIntegration from '../integrations/firebase';
import N8NIntegration from '../integrations/n8n';
import MessageQueue from '../queues/messageQueue';

// Event validation schemas
const eventSchemas = {
  [EventType.RIDER_STATUS_CHANGED]: z.object({
    riderId: z.string(),
    status: z.string(),
    previousStatus: z.string().optional(),
  }),
  [EventType.RIDER_LOCATION_UPDATE]: z.object({
    riderId: z.string(),
    bikeId: z.string(),
    location: z.object({
      latitude: z.number(),
      longitude: z.number(),
      speed: z.number().optional(),
      heading: z.number().optional(),
      accuracy: z.number().optional(),
    }),
  }),
  [EventType.EXPENSE_SUBMITTED]: z.object({
    expenseId: z.string(),
    riderId: z.string(),
    amount: z.number(),
    type: z.string(),
  }),
};

export class EventRouter extends EventEmitter {
  private firebase: FirebaseIntegration;
  private n8n: N8NIntegration;
  private messageQueue: MessageQueue;
  private eventHandlers: Map<EventType, Set<(event: MCPEvent) => Promise<void>>> = new Map();
  private eventFilters: Map<string, (event: MCPEvent) => boolean> = new Map();

  constructor(
    firebase: FirebaseIntegration,
    n8n: N8NIntegration,
    messageQueue: MessageQueue
  ) {
    super();
    this.firebase = firebase;
    this.n8n = n8n;
    this.messageQueue = messageQueue;
    
    this.setupEventListeners();
    this.registerDefaultHandlers();
    
    logger.info('Event router initialized');
  }

  private setupEventListeners(): void {
    // Listen to Firebase events
    this.firebase.on('event', (event: MCPEvent) => {
      this.handleEvent(event);
    });

    // Listen to N8N events
    this.n8n.on('event', (event: MCPEvent) => {
      this.handleEvent(event);
    });
  }

  private registerDefaultHandlers(): void {
    // Default handler for rider status changes
    this.registerHandler(EventType.RIDER_STATUS_CHANGED, async (event) => {
      // Send to N8N for workflow processing
      await this.n8n.sendEvent(event);
      
      // Store in Firestore for audit
      await this.firebase.writeEvent(event);
      
      // Emit for WebSocket broadcast
      this.emit('broadcast', {
        room: `rider:${event.payload.riderId}`,
        event,
      });
    });

    // Default handler for location updates
    this.registerHandler(EventType.RIDER_LOCATION_UPDATE, async (event) => {
      // Emit for real-time tracking
      this.emit('broadcast', {
        room: 'tracking',
        event,
      });
      
      // Store in Firestore with TTL
      await this.firebase.writeEvent(event);
    });

    // Default handler for expense submissions
    this.registerHandler(EventType.EXPENSE_SUBMITTED, async (event) => {
      // Send to N8N for approval workflow
      await this.n8n.sendEvent(event);
      
      // Notify finance team
      this.emit('notify', {
        role: 'finance',
        notification: {
          title: 'New Expense Submission',
          message: `Expense of AED ${event.payload.amount} submitted by rider ${event.payload.riderId}`,
          type: 'info',
          data: event.payload,
        },
      });
    });
  }

  registerHandler(eventType: EventType, handler: (event: MCPEvent) => Promise<void>): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);
    logger.debug(`Handler registered for event type: ${eventType}`);
  }

  registerFilter(filterId: string, filter: (event: MCPEvent) => boolean): void {
    this.eventFilters.set(filterId, filter);
    logger.debug(`Filter registered: ${filterId}`);
  }

  private validateEvent(event: MCPEvent): boolean {
    const schema = eventSchemas[event.type];
    if (!schema) {
      logger.warn(`No validation schema for event type: ${event.type}`);
      return true; // Allow unvalidated events
    }

    try {
      schema.parse(event.payload);
      return true;
    } catch (error) {
      logger.error(`Event validation failed for ${event.type}:`, error);
      return false;
    }
  }

  private async handleEvent(event: MCPEvent): Promise<void> {
    try {
      // Validate event
      if (!this.validateEvent(event)) {
        logger.error(`Invalid event received: ${event.type}`);
        return;
      }

      // Apply filters
      for (const [filterId, filter] of this.eventFilters) {
        if (!filter(event)) {
          logger.debug(`Event filtered out by ${filterId}`);
          return;
        }
      }

      // Add to queue for processing
      await this.messageQueue.addEvent(event);

      // Get handlers for this event type
      const handlers = this.eventHandlers.get(event.type);
      if (!handlers || handlers.size === 0) {
        logger.warn(`No handlers registered for event type: ${event.type}`);
        return;
      }

      // Execute all handlers in parallel
      const handlerPromises = Array.from(handlers).map(handler => 
        handler(event).catch(error => {
          logger.error(`Handler error for ${event.type}:`, error);
        })
      );

      await Promise.all(handlerPromises);

      // Emit event processed
      this.emit('event:processed', event);
      
      logger.debug(`Event processed successfully: ${event.type}`);
    } catch (error) {
      logger.error(`Error handling event ${event.type}:`, error);
      this.emit('event:error', { event, error });
    }
  }

  // Route event to specific destinations
  async routeEvent(event: MCPEvent, destinations: string[]): Promise<void> {
    const routingPromises = destinations.map(async (destination) => {
      switch (destination) {
        case 'firebase':
          await this.firebase.writeEvent(event);
          break;
        case 'n8n':
          await this.n8n.sendEvent(event);
          break;
        case 'broadcast':
          this.emit('broadcast', { room: 'all', event });
          break;
        default:
          logger.warn(`Unknown routing destination: ${destination}`);
      }
    });

    await Promise.all(routingPromises);
  }

  // Get event statistics
  getEventStats(): {
    handlers: Record<string, number>;
    filters: number;
  } {
    const handlers: Record<string, number> = {};
    
    this.eventHandlers.forEach((handlerSet, eventType) => {
      handlers[eventType] = handlerSet.size;
    });

    return {
      handlers,
      filters: this.eventFilters.size,
    };
  }

  // Clear all handlers and filters
  reset(): void {
    this.eventHandlers.clear();
    this.eventFilters.clear();
    this.registerDefaultHandlers();
    logger.info('Event router reset');
  }
}

export default EventRouter;