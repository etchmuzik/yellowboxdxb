/**
 * Health check routes
 */

import { Router, Request, Response } from 'express';
import { db } from '../services/firebase';
import { HealthCheckResponse } from '../types';
import Redis from 'ioredis';
import { redisConfig } from '../config';

const router = Router();

/**
 * Basic health check
 */
router.get('/', async (req: Request, res: Response) => {
  const uptime = process.uptime();
  
  res.json({
    status: 'healthy',
    uptime,
    timestamp: new Date().toISOString()
  });
});

/**
 * Detailed health check
 */
router.get('/detailed', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Check Firebase connection
    let firebaseStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
    try {
      await db.collection('_health').doc('test').get();
      firebaseStatus = 'connected';
    } catch (error) {
      firebaseStatus = 'error';
    }

    // Check N8N connection
    let n8nStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
    try {
      const n8nIntegration = req.app.locals.n8nIntegration;
      const status = await n8nIntegration.getStatus();
      n8nStatus = status.connected ? 'connected' : 'disconnected';
    } catch (error) {
      n8nStatus = 'error';
    }

    // Check Redis connection
    let redisStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
    try {
      const redis = new Redis(redisConfig);
      await redis.ping();
      redisStatus = 'connected';
      redis.disconnect();
    } catch (error) {
      redisStatus = 'error';
    }

    // Get metrics from services
    const wsService = req.app.locals.wsService;
    const sseService = req.app.locals.sseService;
    const eventRouter = req.app.locals.eventRouter;
    
    const wsMetrics = wsService ? wsService.getMetrics() : { connectedClients: 0 };
    const sseMetrics = sseService ? sseService.getMetrics() : { totalClients: 0 };
    const routerMetrics = eventRouter ? eventRouter.getMetrics() : {};

    // Determine overall health status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (firebaseStatus === 'error' || n8nStatus === 'error') {
      overallStatus = 'unhealthy';
    } else if (firebaseStatus === 'disconnected' || n8nStatus === 'disconnected') {
      overallStatus = 'degraded';
    }

    const response: HealthCheckResponse = {
      status: overallStatus,
      uptime: process.uptime(),
      timestamp: new Date(),
      connections: {
        websocket: wsMetrics.connectedClients,
        sse: sseMetrics.totalClients
      },
      integrations: {
        firebase: firebaseStatus,
        n8n: n8nStatus,
        redis: redisStatus
      },
      metrics: {
        eventsProcessed: routerMetrics.eventsProcessed || 0,
        averageLatency: Date.now() - startTime,
        errorRate: routerMetrics.eventsFailed ? 
          (routerMetrics.eventsFailed / routerMetrics.eventsProcessed) * 100 : 0
      }
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: 'Failed to perform health check'
    });
  }
});

/**
 * Liveness probe for Kubernetes
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).send('OK');
});

/**
 * Readiness probe for Kubernetes
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check if Firebase is connected
    await db.collection('_health').doc('test').get();
    res.status(200).send('OK');
  } catch (error) {
    res.status(503).send('Not Ready');
  }
});

export { router as healthRouter };