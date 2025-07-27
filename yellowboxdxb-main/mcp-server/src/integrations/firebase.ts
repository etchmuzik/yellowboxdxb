import * as admin from 'firebase-admin';
import config from '../config';
import logger from '../utils/logger';
import { EventType, EventSource, MCPEvent } from '../types';
import { EventEmitter } from 'events';

class FirebaseIntegration extends EventEmitter {
  private app: admin.app.App;
  private db: admin.firestore.Firestore;
  private auth: admin.auth.Auth;
  private listeners: Map<string, () => void> = new Map();

  constructor() {
    super();
    this.app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        privateKey: config.firebase.privateKey,
        clientEmail: config.firebase.clientEmail,
      }),
    });
    
    this.db = admin.firestore();
    this.auth = admin.auth();
    
    logger.info('Firebase integration initialized');
  }

  async initialize(): Promise<void> {
    try {
      // Set up Firestore listeners for real-time updates
      await this.setupListeners();
      logger.info('Firebase listeners set up successfully');
    } catch (error) {
      logger.error('Failed to initialize Firebase integration:', error);
      throw error;
    }
  }

  private async setupListeners(): Promise<void> {
    // Listen to rider status changes
    const ridersListener = this.db.collection('riders')
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const data = change.doc.data();
            const event: MCPEvent = {
              id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: EventType.RIDER_STATUS_CHANGED,
              source: EventSource.FIREBASE,
              payload: {
                riderId: change.doc.id,
                status: data.status,
                previousStatus: data.previousStatus,
                data,
              },
              timestamp: new Date(),
              metadata: {
                collection: 'riders',
                documentId: change.doc.id,
              },
            };
            this.emit('event', event);
          }
        });
      });
    this.listeners.set('riders', ridersListener);

    // Listen to expense updates
    const expensesListener = this.db.collection('expenses')
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data();
          let eventType: EventType;
          
          switch (change.type) {
            case 'added':
              eventType = EventType.EXPENSE_SUBMITTED;
              break;
            case 'modified':
              if (data.status === 'approved') {
                eventType = EventType.EXPENSE_APPROVED;
              } else if (data.status === 'rejected') {
                eventType = EventType.EXPENSE_REJECTED;
              } else {
                return;
              }
              break;
            default:
              return;
          }

          const event: MCPEvent = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: eventType,
            source: EventSource.FIREBASE,
            payload: {
              expenseId: change.doc.id,
              riderId: data.riderId,
              amount: data.amount,
              status: data.status,
              data,
            },
            timestamp: new Date(),
            userId: data.riderId,
            metadata: {
              collection: 'expenses',
              documentId: change.doc.id,
            },
          };
          this.emit('event', event);
        });
      });
    this.listeners.set('expenses', expensesListener);

    // Listen to location updates
    const locationsListener = this.db.collection('locations')
      .where('timestamp', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added' || change.type === 'modified') {
            const data = change.doc.data();
            const event: MCPEvent = {
              id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: EventType.BIKE_LOCATION_UPDATE,
              source: EventSource.FIREBASE,
              payload: {
                riderId: data.riderId,
                bikeId: data.bikeId,
                location: {
                  latitude: data.latitude,
                  longitude: data.longitude,
                  speed: data.speed,
                  heading: data.heading,
                  accuracy: data.accuracy,
                },
                timestamp: data.timestamp?.toDate() || new Date(),
              },
              timestamp: new Date(),
              userId: data.riderId,
              metadata: {
                collection: 'locations',
                documentId: change.doc.id,
              },
            };
            this.emit('event', event);
          }
        });
      });
    this.listeners.set('locations', locationsListener);

    // Listen to document uploads
    const documentsListener = this.db.collection('rider_documents')
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data();
          let eventType: EventType;
          
          if (change.type === 'added') {
            eventType = EventType.RIDER_DOCUMENT_UPLOADED;
          } else if (change.type === 'modified' && data.verified) {
            eventType = EventType.RIDER_DOCUMENT_VERIFIED;
          } else {
            return;
          }

          const event: MCPEvent = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: eventType,
            source: EventSource.FIREBASE,
            payload: {
              riderId: data.riderId,
              documentType: data.type,
              verified: data.verified,
              data,
            },
            timestamp: new Date(),
            userId: data.riderId,
            metadata: {
              collection: 'rider_documents',
              documentId: change.doc.id,
            },
          };
          this.emit('event', event);
        });
      });
    this.listeners.set('rider_documents', documentsListener);
  }

  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    try {
      return await this.auth.verifyIdToken(idToken);
    } catch (error) {
      logger.error('Failed to verify ID token:', error);
      throw error;
    }
  }

  async getUserRole(uid: string): Promise<string> {
    try {
      const userDoc = await this.db.collection('users').doc(uid).get();
      if (userDoc.exists) {
        return userDoc.data()?.role || 'rider';
      }
      return 'rider';
    } catch (error) {
      logger.error('Failed to get user role:', error);
      return 'rider';
    }
  }

  async writeEvent(event: MCPEvent): Promise<void> {
    try {
      await this.db.collection('mcp_events').add({
        ...event,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      logger.error('Failed to write event to Firestore:', error);
      throw error;
    }
  }

  async sendNotification(userId: string, notification: any): Promise<void> {
    try {
      await this.db.collection('notifications').add({
        userId,
        ...notification,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  destroy(): void {
    // Clean up listeners
    this.listeners.forEach((unsubscribe) => unsubscribe());
    this.listeners.clear();
    
    // Delete the app
    this.app.delete();
    
    logger.info('Firebase integration destroyed');
  }
}

export default FirebaseIntegration;