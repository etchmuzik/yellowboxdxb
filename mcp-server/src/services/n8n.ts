/**
 * N8N Integration Service
 * Handles communication with N8N workflows
 */

import axios from 'axios';
import { EventRouter } from './eventRouter';
import { FleetEvent, N8NWebhookPayload, Priority } from '../types';
import { n8nConfig } from '../config';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class N8NIntegration {
  private eventRouter: EventRouter;
  private webhookUrl: string;
  private apiKey?: string;
  private retryAttempts = 3;
  private retryDelay = 1000; // 1 second

  constructor(eventRouter: EventRouter) {
    this.eventRouter = eventRouter;
    this.webhookUrl = n8nConfig.webhookUrl;
    this.apiKey = n8nConfig.apiKey;
    
    // Subscribe to relevant events
    this.subscribeToEvents();
  }

  /**
   * Subscribe to events that should be sent to N8N
   */
  private subscribeToEvents(): void {
    // Subscribe to all event types for N8N sync
    const eventTypes = [
      'rider_location',
      'expense_submitted',
      'expense_updated',
      'document_uploaded',
      'document_verified',
      'bike_status',
      'bike_assigned'
    ];

    eventTypes.forEach(eventType => {
      this.eventRouter.on(`event:${eventType}`, async (event: FleetEvent) => {
        await this.sendToN8N(event);
      });
    });

    logger.info('N8N Integration subscribed to events');
  }

  /**
   * Send event to N8N webhook
   */
  private async sendToN8N(event: FleetEvent): Promise<void> {
    // Convert FleetEvent to N8N webhook payload
    const payload: N8NWebhookPayload = {
      operation: event.type,
      data: {
        id: event.id,
        ...event.payload,
        userId: event.userId,
        source: event.source
      },
      timestamp: event.timestamp.toISOString(),
      source: 'mcp-server',
      eventId: event.id,
      priority: event.priority
    };

    await this.sendWebhook(payload);
  }

  /**
   * Send webhook with retry logic
   */
  private async sendWebhook(
    payload: N8NWebhookPayload,
    attempt: number = 1
  ): Promise<void> {
    try {
      const headers: any = {
        'Content-Type': 'application/json'
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await axios.post(this.webhookUrl, payload, {
        headers,
        timeout: 30000 // 30 seconds
      });

      if (response.status === 200) {
        logger.debug(`✅ N8N webhook sent successfully for ${payload.operation}`);
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error: any) {
      logger.error(`❌ N8N webhook failed (attempt ${attempt}):`, error.message);

      // Retry logic
      if (attempt < this.retryAttempts) {
        const delay = this.retryDelay * attempt;
        logger.info(`Retrying N8N webhook in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWebhook(payload, attempt + 1);
      }

      // Log final failure but don't throw to prevent disrupting other operations
      logger.error(`Failed to send webhook after ${this.retryAttempts} attempts`);
    }
  }

  /**
   * Trigger sync for specific entity
   */
  async triggerSync(
    type: 'rider' | 'expense' | 'document' | 'bike',
    id: string,
    action: 'created' | 'updated' | 'deleted',
    data: any
  ): Promise<void> {
    const payload: N8NWebhookPayload = {
      operation: `${type}_${action}`,
      data: {
        id,
        ...data
      },
      timestamp: new Date().toISOString(),
      source: 'mcp-server',
      eventId: uuidv4(),
      priority: this.determinePriority(type, action)
    };

    await this.sendWebhook(payload);
  }

  /**
   * Batch sync multiple records
   */
  async triggerBatchSync(
    items: Array<{
      type: string;
      id: string;
      action: string;
      data: any;
    }>
  ): Promise<void> {
    const batchPayload = {
      batch: true,
      items: items.map(item => ({
        operation: `${item.type}_${item.action}`,
        data: {
          id: item.id,
          ...item.data
        },
        timestamp: new Date().toISOString()
      })),
      timestamp: new Date().toISOString(),
      source: 'mcp-server',
      eventId: uuidv4()
    };

    await this.sendWebhook(batchPayload as any);
  }

  /**
   * Test N8N connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const testPayload: N8NWebhookPayload = {
        operation: 'test_connection',
        data: {
          message: 'Testing MCP to N8N connectivity',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        source: 'mcp-server',
        eventId: uuidv4(),
        priority: 'low'
      };

      const headers: any = {
        'Content-Type': 'application/json'
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      const response = await axios.post(this.webhookUrl, testPayload, {
        headers,
        timeout: 10000 // 10 seconds
      });

      return response.status === 200;
    } catch (error) {
      logger.error('N8N connection test failed:', error);
      return false;
    }
  }

  /**
   * Determine priority based on event type and action
   */
  private determinePriority(type: string, action: string): Priority {
    // Critical events
    if (type === 'expense' && action === 'created') {
      return 'high';
    }
    if (type === 'document' && action === 'created') {
      return 'high';
    }
    
    // Medium priority events
    if (action === 'updated') {
      return 'medium';
    }
    
    // Default to low
    return 'low';
  }

  /**
   * Get N8N integration status
   */
  async getStatus(): Promise<{
    connected: boolean;
    webhookUrl: string;
    lastError?: string;
  }> {
    const connected = await this.testConnection();
    
    return {
      connected,
      webhookUrl: this.webhookUrl
    };
  }
}