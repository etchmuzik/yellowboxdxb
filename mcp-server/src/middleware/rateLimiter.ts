/**
 * Rate limiting middleware
 */

import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { config } from '../config';
import { logger } from '../utils/logger';

// Create rate limiter instance
const rateLimiter = new RateLimiterMemory({
  points: config.security.rateLimiting.maxRequests,
  duration: config.security.rateLimiting.windowMs / 1000, // Convert to seconds
  blockDuration: 60 // Block for 1 minute after limit exceeded
});

export async function rateLimiterMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Use IP address as key
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    
    await rateLimiter.consume(key);
    next();
  } catch (rejRes: any) {
    logger.warn(`Rate limit exceeded for ${req.ip}`);
    
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000) || 60
    });
  }
}

// Export named for consistency
export { rateLimiterMiddleware as rateLimiter };