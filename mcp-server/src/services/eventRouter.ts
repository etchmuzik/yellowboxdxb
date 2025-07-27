/**
 * Event Router Service
 * Routes events to appropriate handlers and manages subscriptions
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { FleetEvent, EventType, Priority, Subscription } from '../types';
import { logger } from '../utils/logger';

export class EventRouter extends EventEmitter {
  private subscriptions: Map<string, Subscription> = new Map();
  private eventQueue: FleetEvent[] = [];
  private processing = false;
  private metrics = {
    eventsProcessed: 0,
    eventsFailed: 0,
    averageProcessingTime: 0
  };

  constructor() {
    super();
    this.setMaxListeners(1000); // Support many concurrent connections
  }

  /**
   * Route an event to subscribers
   */
  async routeEvent(event: FleetEvent): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Add to queue
      this.eventQueue.push(event);
      
      // Process queue if not already processing
      if (!this.processing) {
        await this.processQueue();
      }

      // Update metrics
      this.metrics.eventsProcessed++;
      this.updateAverageProcessingTime(Date.now() - startTime);
      
    } catch (error) {
      this.metrics.eventsFailed++;
      logger.error('Failed to route event:', error);
      throw error;
    }
  }

  /**
   * Process event queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.eventQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      
      try {
        // Find matching subscriptions
        const matchingSubscriptions = this.findMatchingSubscriptions(event);
        
        // Emit to all matching subscribers
        for (const subscription of matchingSubscriptions) {
          this.emit(`event:${subscription.id}`, event);
        }

        // Emit general event for logging/monitoring
        this.emit('event', event);
        
        // Emit specific event type
        this.emit(`event:${event.type}`, event);
        
        logger.debug(`Routed event ${event.id} to ${matchingSubscriptions.length} subscribers`);
        
      } catch (error) {
        logger.error(`Failed to process event ${event.id}:`, error);
      }
    }

    this.processing = false;
  }

  /**
   * Subscribe to events
   */
  subscribe(
    userId: string,
    eventTypes: EventType[],
    channel: 'websocket' | 'sse' | 'webhook',
    filters?: Record<string, any>
  ): string {
    const subscriptionId = uuidv4();
    
    const subscription: Subscription = {
      id: subscriptionId,
      userId,
      eventTypes,
      filters,
      channel,
      createdAt: new Date()
    };

    this.subscriptions.set(subscriptionId, subscription);
    
    logger.info(`Created subscription ${subscriptionId} for user ${userId}`);
    
    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    const deleted = this.subscriptions.delete(subscriptionId);
    
    if (deleted) {
      // Remove all listeners for this subscription
      this.removeAllListeners(`event:${subscriptionId}`);
      logger.info(`Removed subscription ${subscriptionId}`);
    }
    
    return deleted;
  }

  /**
   * Broadcast event to specific subscribers
   */
  async broadcast(event: FleetEvent, subscriberIds: string[]): Promise<void> {
    for (const subscriberId of subscriberIds) {
      const subscription = this.subscriptions.get(subscriberId);
      
      if (subscription && this.eventMatchesSubscription(event, subscription)) {
        this.emit(`event:${subscriberId}`, event);
      }
    }
  }

  /**
   * Find subscriptions matching an event
   */
  private findMatchingSubscriptions(event: FleetEvent): Subscription[] {
    const matching: Subscription[] = [];

    this.subscriptions.forEach((subscription) => {
      if (this.eventMatchesSubscription(event, subscription)) {
        matching.push(subscription);
      }
    });

    return matching;
  }

  /**
   * Check if event matches subscription criteria
   */
  private eventMatchesSubscription(event: FleetEvent, subscription: Subscription): boolean {
    // Check event type
    if (!subscription.eventTypes.includes(event.type)) {
      return false;
    }

    // Check filters
    if (subscription.filters) {
      for (const [key, value] of Object.entries(subscription.filters)) {
        if (event.payload[key] !== value) {
          return false;
        }
      }
    }

    // Check target subscribers if specified
    if (event.targetSubscribers && !event.targetSubscribers.includes(subscription.id)) {
      return false;
    }

    return true;
  }

  /**
   * Get subscription by ID
   */
  getSubscription(subscriptionId: string): Subscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  /**
   * Get all subscriptions for a user
   */
  getUserSubscriptions(userId: string): Subscription[] {
    const userSubscriptions: Subscription[] = [];
    
    this.subscriptions.forEach((subscription) => {
      if (subscription.userId === userId) {
        userSubscriptions.push(subscription);
      }
    });

    return userSubscriptions;
  }

  /**
   * Clean up expired subscriptions
   */
  cleanupSubscriptions(maxAge: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let removed = 0;

    this.subscriptions.forEach((subscription, id) => {
      if (now - subscription.createdAt.getTime() > maxAge) {
        this.unsubscribe(id);
        removed++;
      }
    });

    if (removed > 0) {
      logger.info(`Cleaned up ${removed} expired subscriptions`);
    }

    return removed;
  }

  /**
   * Update average processing time
   */
  private updateAverageProcessingTime(newTime: number): void {
    const total = this.metrics.eventsProcessed;
    const currentAvg = this.metrics.averageProcessingTime;
    
    this.metrics.averageProcessingTime = ((currentAvg * (total - 1)) + newTime) / total;
  }

  /**
   * Get router metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeSubscriptions: this.subscriptions.size,
      queueSize: this.eventQueue.length
    };
  }

  /**
   * Create a high-priority event
   */
  createCriticalEvent(type: EventType, payload: any, source: string): FleetEvent {
    return {
      id: uuidv4(),
      type,
      priority: 'critical',
      payload,
      timestamp: new Date(),
      source
    };
  }
}