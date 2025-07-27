import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import config from '../config';
import logger from '../utils/logger';
import { MCPEvent, EventType, EventSource, WebhookPayload } from '../types';

class N8NIntegration extends EventEmitter {
  private client: AxiosInstance;
  private webhookEndpoints: Map<string, string> = new Map();

  constructor() {
    super();
    this.client = axios.create({
      baseURL: config.n8n.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.n8n.webhookAuthToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Configure webhook endpoints
    this.setupWebhookEndpoints();
    
    logger.info('N8N integration initialized');
  }

  private setupWebhookEndpoints(): void {
    // Map event types to N8N webhook endpoints
    this.webhookEndpoints.set(
      EventType.RIDER_STATUS_CHANGED,
      '/webhook/rider-status-changed'
    );
    this.webhookEndpoints.set(
      EventType.EXPENSE_SUBMITTED,
      '/webhook/expense-submitted'
    );
    this.webhookEndpoints.set(
      EventType.EXPENSE_APPROVED,
      '/webhook/expense-approved'
    );
    this.webhookEndpoints.set(
      EventType.BIKE_ASSIGNED,
      '/webhook/bike-assigned'
    );
    this.webhookEndpoints.set(
      EventType.RIDER_DOCUMENT_VERIFIED,
      '/webhook/document-verified'
    );
  }

  async sendEvent(event: MCPEvent): Promise<void> {
    const endpoint = this.webhookEndpoints.get(event.type);
    
    if (!endpoint) {
      logger.debug(`No N8N webhook configured for event type: ${event.type}`);
      return;
    }

    try {
      const payload: WebhookPayload = {
        webhookId: `whk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        event: event.type,
        data: event.payload,
        timestamp: event.timestamp,
      };

      const response = await this.client.post(endpoint, payload);
      
      logger.info(`Event sent to N8N successfully`, {
        eventType: event.type,
        webhookId: payload.webhookId,
        status: response.status,
      });

      // Emit success event
      this.emit('webhook:success', {
        event,
        response: response.data,
      });
    } catch (error: any) {
      logger.error('Failed to send event to N8N:', {
        eventType: event.type,
        error: error.message,
        response: error.response?.data,
      });

      // Emit failure event
      this.emit('webhook:failure', {
        event,
        error: error.message,
      });

      throw error;
    }
  }

  async processWebhookRequest(path: string, data: any): Promise<any> {
    try {
      // Validate webhook path
      const isValidEndpoint = Array.from(this.webhookEndpoints.values())
        .some(endpoint => endpoint === path);

      if (!isValidEndpoint) {
        throw new Error(`Invalid webhook endpoint: ${path}`);
      }

      // Create event from webhook data
      const event: MCPEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: EventType.WEBHOOK_RECEIVED,
        source: EventSource.N8N,
        payload: data,
        timestamp: new Date(),
        metadata: {
          webhookPath: path,
        },
      };

      // Emit event for processing
      this.emit('event', event);

      return {
        success: true,
        eventId: event.id,
        timestamp: event.timestamp,
      };
    } catch (error: any) {
      logger.error('Failed to process webhook request:', {
        path,
        error: error.message,
      });
      throw error;
    }
  }

  async triggerWorkflow(workflowId: string, data: any): Promise<any> {
    try {
      const response = await this.client.post(`/workflows/${workflowId}/execute`, {
        data,
      });

      logger.info(`N8N workflow triggered successfully`, {
        workflowId,
        executionId: response.data.executionId,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to trigger N8N workflow:', {
        workflowId,
        error: error.message,
      });
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch (error) {
      logger.error('N8N connection test failed:', error);
      return false;
    }
  }

  // Batch process multiple events
  async sendBatchEvents(events: MCPEvent[]): Promise<void> {
    const results = await Promise.allSettled(
      events.map(event => this.sendEvent(event))
    );

    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      logger.warn(`Failed to send ${failed.length} out of ${events.length} events to N8N`);
    }
  }
}

export default N8NIntegration;