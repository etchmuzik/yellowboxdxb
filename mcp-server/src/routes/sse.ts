/**
 * Server-Sent Events routes
 */

import { Router, Request, Response } from 'express';
import { verifyIdToken, getUserById } from '../services/firebase';
import { AuthContext } from '../types';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * SSE endpoint for dashboard updates
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    // Get auth token from query params (SSE doesn't support headers well)
    const token = req.query.token as string;
    
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    // Verify token
    const decodedToken = await verifyIdToken(token);
    const user = await getUserById(decodedToken.uid);

    // Create auth context
    const authContext: AuthContext = {
      userId: decodedToken.uid,
      email: decodedToken.email || '',
      role: user.role,
      authenticated: true,
      sessionId: uuidv4()
    };

    // Get SSE service
    const sseService = req.app.locals.sseService;
    const clientId = uuidv4();

    // Add client
    sseService.addClient(clientId, res, authContext);

  } catch (error) {
    logger.error('SSE dashboard connection failed:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

/**
 * SSE endpoint for fleet tracking
 */
router.get('/fleet', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const decodedToken = await verifyIdToken(token);
    const user = await getUserById(decodedToken.uid);

    // Only allow admin and operations roles
    if (user.role !== 'Admin' && user.role !== 'Operations') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const authContext: AuthContext = {
      userId: decodedToken.uid,
      email: decodedToken.email || '',
      role: user.role,
      authenticated: true,
      sessionId: uuidv4()
    };

    const sseService = req.app.locals.sseService;
    const clientId = uuidv4();

    // Add client with fleet-specific events
    sseService.addClient(clientId, res, authContext, [
      'rider_location',
      'bike_status',
      'fleet_alert'
    ]);

  } catch (error) {
    logger.error('SSE fleet connection failed:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

/**
 * SSE endpoint for alerts
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const decodedToken = await verifyIdToken(token);
    const user = await getUserById(decodedToken.uid);

    const authContext: AuthContext = {
      userId: decodedToken.uid,
      email: decodedToken.email || '',
      role: user.role,
      authenticated: true,
      sessionId: uuidv4()
    };

    const sseService = req.app.locals.sseService;
    const clientId = uuidv4();

    // Add client with alert events
    sseService.addClient(clientId, res, authContext, [
      'system_alert',
      'fleet_alert',
      'budget_alert'
    ]);

  } catch (error) {
    logger.error('SSE alerts connection failed:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

/**
 * SSE endpoint for expense updates (Finance role)
 */
router.get('/expenses', async (req: Request, res: Response) => {
  try {
    const token = req.query.token as string;
    
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const decodedToken = await verifyIdToken(token);
    const user = await getUserById(decodedToken.uid);

    // Only allow finance and admin roles
    if (user.role !== 'Admin' && user.role !== 'Finance') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const authContext: AuthContext = {
      userId: decodedToken.uid,
      email: decodedToken.email || '',
      role: user.role,
      authenticated: true,
      sessionId: uuidv4()
    };

    const sseService = req.app.locals.sseService;
    const clientId = uuidv4();

    // Add client with expense events
    sseService.addClient(clientId, res, authContext, [
      'expense_submitted',
      'expense_updated',
      'budget_alert'
    ]);

  } catch (error) {
    logger.error('SSE expenses connection failed:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

export { router as sseRouter };