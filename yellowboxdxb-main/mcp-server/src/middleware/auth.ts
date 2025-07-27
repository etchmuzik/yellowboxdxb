import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import config from '../config';
import logger from '../utils/logger';
import FirebaseIntegration from '../integrations/firebase';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
  };
}

export interface AuthSocket extends Socket {
  user?: {
    uid: string;
    email: string;
    role: string;
  };
}

export class AuthMiddleware {
  constructor(private firebase: FirebaseIntegration) {}

  // Express middleware for REST endpoints
  async authenticate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
      }

      const token = authHeader.substring(7);
      
      // Try Firebase ID token first
      try {
        const decodedToken = await this.firebase.verifyIdToken(token);
        const role = await this.firebase.getUserRole(decodedToken.uid);
        
        req.user = {
          uid: decodedToken.uid,
          email: decodedToken.email || '',
          role,
        };
        
        next();
        return;
      } catch (firebaseError) {
        // If Firebase verification fails, try JWT
        try {
          const decoded = jwt.verify(token, config.jwt.secret) as any;
          req.user = {
            uid: decoded.uid,
            email: decoded.email,
            role: decoded.role,
          };
          
          next();
          return;
        } catch (jwtError) {
          logger.error('Token verification failed:', { firebaseError, jwtError });
          res.status(401).json({ error: 'Invalid token' });
          return;
        }
      }
    } catch (error) {
      logger.error('Authentication error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  }

  // Role-based access control
  requireRole(...roles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      next();
    };
  }

  // Socket.IO authentication
  async authenticateSocket(socket: AuthSocket, next: (err?: Error) => void): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.substring(7);
      
      if (!token) {
        next(new Error('No token provided'));
        return;
      }

      // Try Firebase ID token first
      try {
        const decodedToken = await this.firebase.verifyIdToken(token);
        const role = await this.firebase.getUserRole(decodedToken.uid);
        
        socket.user = {
          uid: decodedToken.uid,
          email: decodedToken.email || '',
          role,
        };
        
        next();
      } catch (firebaseError) {
        // If Firebase verification fails, try JWT
        try {
          const decoded = jwt.verify(token, config.jwt.secret) as any;
          socket.user = {
            uid: decoded.uid,
            email: decoded.email,
            role: decoded.role,
          };
          
          next();
        } catch (jwtError) {
          logger.error('Socket token verification failed:', { firebaseError, jwtError });
          next(new Error('Invalid token'));
        }
      }
    } catch (error: any) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  }

  // Generate JWT token (for testing or non-Firebase auth)
  generateToken(user: { uid: string; email: string; role: string }): string {
    return jwt.sign(
      {
        uid: user.uid,
        email: user.email,
        role: user.role,
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
      }
    );
  }

  // Verify webhook signatures
  verifyWebhookSignature(req: Request, res: Response, next: NextFunction): void {
    const signature = req.headers['x-webhook-signature'];
    const authToken = req.headers['x-auth-token'];

    // For N8N webhooks
    if (authToken && authToken === config.n8n.webhookAuthToken) {
      next();
      return;
    }

    // For other webhooks with signature
    if (signature) {
      // Implement signature verification logic here
      // For now, we'll just check if signature exists
      next();
      return;
    }

    res.status(401).json({ error: 'Invalid webhook authentication' });
  }
}

export default AuthMiddleware;