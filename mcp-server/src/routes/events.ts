/**
 * Event management routes
 */

import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { verifyIdToken } from '../services/firebase';
import { FleetEvent, EventType, Priority } from '../types';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * Authentication middleware
 */
async function authenticate(req: Request, res: Response, next: Function) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await verifyIdToken(token);
    
    // Add user info to request
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    logger.error('Authentication failed:', error);
    res.status(401).json({ error: 'Invalid authorization token' });
  }
}

/**
 * Submit event
 */
router.post(
  '/',
  authenticate,
  [
    body('type').isIn([
      'rider_location',
      'expense_submitted',
      'expense_updated',
      'document_uploaded',
      'document_verified',
      'bike_status',
      'bike_assigned',
      'system_alert',
      'fleet_alert',
      'budget_alert'
    ]),
    body('payload').isObject(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical'])
  ],
  async (req: Request, res: Response) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = (req as any).user;
      const eventRouter = req.app.locals.eventRouter;

      // Create event
      const event: FleetEvent = {
        id: uuidv4(),
        type: req.body.type as EventType,
        priority: (req.body.priority as Priority) || 'medium',
        payload: req.body.payload,
        timestamp: new Date(),
        source: 'api',
        userId: user.uid
      };

      // Route event
      await eventRouter.routeEvent(event);

      res.json({
        success: true,
        eventId: event.id
      });
    } catch (error: any) {
      logger.error('Failed to submit event:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Subscribe to events
 */
router.post(
  '/subscribe',
  authenticate,
  [
    body('eventTypes').isArray().notEmpty(),
    body('channel').isIn(['websocket', 'sse', 'webhook'])
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = (req as any).user;
      const eventRouter = req.app.locals.eventRouter;

      // Create subscription
      const subscriptionId = eventRouter.subscribe(
        user.uid,
        req.body.eventTypes,
        req.body.channel,
        req.body.filters
      );

      res.json({
        success: true,
        subscriptionId
      });
    } catch (error: any) {
      logger.error('Failed to create subscription:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Unsubscribe from events
 */
router.delete(
  '/subscribe/:subscriptionId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const eventRouter = req.app.locals.eventRouter;
      const success = eventRouter.unsubscribe(req.params.subscriptionId);

      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Subscription not found' });
      }
    } catch (error: any) {
      logger.error('Failed to unsubscribe:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Get user subscriptions
 */
router.get(
  '/subscriptions',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const eventRouter = req.app.locals.eventRouter;
      
      const subscriptions = eventRouter.getUserSubscriptions(user.uid);

      res.json({
        subscriptions
      });
    } catch (error: any) {
      logger.error('Failed to get subscriptions:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * Batch event submission
 */
router.post(
  '/batch',
  authenticate,
  [
    body('events').isArray().notEmpty(),
    body('events.*.type').notEmpty(),
    body('events.*.payload').isObject()
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = (req as any).user;
      const eventRouter = req.app.locals.eventRouter;
      const eventIds: string[] = [];

      // Process each event
      for (const eventData of req.body.events) {
        const event: FleetEvent = {
          id: uuidv4(),
          type: eventData.type as EventType,
          priority: (eventData.priority as Priority) || 'medium',
          payload: eventData.payload,
          timestamp: new Date(),
          source: 'api-batch',
          userId: user.uid
        };

        await eventRouter.routeEvent(event);
        eventIds.push(event.id);
      }

      res.json({
        success: true,
        eventIds
      });
    } catch (error: any) {
      logger.error('Failed to submit batch events:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

export { router as eventsRouter };