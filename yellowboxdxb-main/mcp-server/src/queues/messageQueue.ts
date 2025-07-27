import Bull from 'bull';
import { createClient, RedisClientType } from 'redis';
import config from '../config';
import logger from '../utils/logger';
import { MCPEvent, QueueJob } from '../types';

export class MessageQueue {
  private eventQueue: Bull.Queue;
  private notificationQueue: Bull.Queue;
  private webhookQueue: Bull.Queue;
  private redisClient: RedisClientType;

  constructor() {
    // Initialize Redis client
    this.redisClient = createClient({
      socket: {
        host: config.redis.host,
        port: config.redis.port,
      },
      password: config.redis.password,
      database: config.redis.db,
    });

    // Initialize queues
    const redisConfig = {
      redis: {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        db: config.redis.db,
      },
    };

    this.eventQueue = new Bull('mcp-events', redisConfig);
    this.notificationQueue = new Bull('mcp-notifications', redisConfig);
    this.webhookQueue = new Bull('mcp-webhooks', redisConfig);

    this.setupQueueHandlers();
    logger.info('Message queues initialized');
  }

  async connect(): Promise<void> {
    try {
      await this.redisClient.connect();
      logger.info('Redis connection established');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  private setupQueueHandlers(): void {
    // Event queue error handler
    this.eventQueue.on('error', (error) => {
      logger.error('Event queue error:', error);
    });

    this.eventQueue.on('completed', (job) => {
      logger.debug(`Event job ${job.id} completed`);
    });

    this.eventQueue.on('failed', (job, err) => {
      logger.error(`Event job ${job.id} failed:`, err);
    });

    // Similar handlers for other queues
    this.notificationQueue.on('error', (error) => {
      logger.error('Notification queue error:', error);
    });

    this.webhookQueue.on('error', (error) => {
      logger.error('Webhook queue error:', error);
    });
  }

  async addEvent(event: MCPEvent, options?: Bull.JobOptions): Promise<Bull.Job> {
    try {
      const job = await this.eventQueue.add('process-event', event, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
        ...options,
      });

      logger.debug(`Event added to queue: ${event.type}`, { jobId: job.id });
      return job;
    } catch (error) {
      logger.error('Failed to add event to queue:', error);
      throw error;
    }
  }

  async addNotification(notification: any, options?: Bull.JobOptions): Promise<Bull.Job> {
    try {
      const job = await this.notificationQueue.add('send-notification', notification, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        priority: notification.priority || 0,
        ...options,
      });

      logger.debug(`Notification added to queue`, { jobId: job.id });
      return job;
    } catch (error) {
      logger.error('Failed to add notification to queue:', error);
      throw error;
    }
  }

  async addWebhook(webhook: any, options?: Bull.JobOptions): Promise<Bull.Job> {
    try {
      const job = await this.webhookQueue.add('process-webhook', webhook, {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        timeout: 30000,
        ...options,
      });

      logger.debug(`Webhook added to queue`, { jobId: job.id });
      return job;
    } catch (error) {
      logger.error('Failed to add webhook to queue:', error);
      throw error;
    }
  }

  // Process events from queue
  processEvents(handler: (job: Bull.Job) => Promise<void>): void {
    this.eventQueue.process('process-event', 5, async (job) => {
      try {
        await handler(job);
      } catch (error) {
        logger.error(`Error processing event job ${job.id}:`, error);
        throw error;
      }
    });
  }

  // Process notifications from queue
  processNotifications(handler: (job: Bull.Job) => Promise<void>): void {
    this.notificationQueue.process('send-notification', 10, async (job) => {
      try {
        await handler(job);
      } catch (error) {
        logger.error(`Error processing notification job ${job.id}:`, error);
        throw error;
      }
    });
  }

  // Process webhooks from queue
  processWebhooks(handler: (job: Bull.Job) => Promise<void>): void {
    this.webhookQueue.process('process-webhook', 3, async (job) => {
      try {
        await handler(job);
      } catch (error) {
        logger.error(`Error processing webhook job ${job.id}:`, error);
        throw error;
      }
    });
  }

  // Get queue statistics
  async getQueueStats(): Promise<{
    events: Bull.JobCounts;
    notifications: Bull.JobCounts;
    webhooks: Bull.JobCounts;
  }> {
    const [events, notifications, webhooks] = await Promise.all([
      this.eventQueue.getJobCounts(),
      this.notificationQueue.getJobCounts(),
      this.webhookQueue.getJobCounts(),
    ]);

    return { events, notifications, webhooks };
  }

  // Clean old completed jobs
  async cleanQueues(gracePeriod: number = 24 * 60 * 60 * 1000): Promise<void> {
    const cleanOptions = {
      grace: gracePeriod,
      limit: 1000,
    };

    await Promise.all([
      this.eventQueue.clean(gracePeriod, 'completed', cleanOptions.limit),
      this.notificationQueue.clean(gracePeriod, 'completed', cleanOptions.limit),
      this.webhookQueue.clean(gracePeriod, 'completed', cleanOptions.limit),
    ]);

    logger.info('Queue cleanup completed');
  }

  // Pause all queues
  async pauseAll(): Promise<void> {
    await Promise.all([
      this.eventQueue.pause(),
      this.notificationQueue.pause(),
      this.webhookQueue.pause(),
    ]);
    logger.info('All queues paused');
  }

  // Resume all queues
  async resumeAll(): Promise<void> {
    await Promise.all([
      this.eventQueue.resume(),
      this.notificationQueue.resume(),
      this.webhookQueue.resume(),
    ]);
    logger.info('All queues resumed');
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    logger.info('Shutting down message queues...');
    
    // Close all queues
    await Promise.all([
      this.eventQueue.close(),
      this.notificationQueue.close(),
      this.webhookQueue.close(),
    ]);

    // Disconnect Redis
    await this.redisClient.quit();
    
    logger.info('Message queues shut down successfully');
  }
}

export default MessageQueue;