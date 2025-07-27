/**
 * Firebase Admin SDK Service
 * Handles Firebase authentication and Firestore operations
 */

import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';

let app: admin.app.App;
let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;

/**
 * Initialize Firebase Admin SDK
 */
export async function initializeFirebase(config: {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}) {
  try {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey
      })
    });

    db = admin.firestore();
    auth = admin.auth();

    // Test connection
    await db.collection('_health').doc('test').set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: 'connected'
    });

    logger.info('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize Firebase:', error);
    throw error;
  }
}

/**
 * Verify Firebase ID token
 */
export async function verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
  try {
    return await auth.verifyIdToken(token);
  } catch (error) {
    logger.error('Failed to verify ID token:', error);
    throw error;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    return { id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    logger.error(`Failed to get user ${userId}:`, error);
    throw error;
  }
}

/**
 * Subscribe to Firestore changes
 */
export function subscribeToCollection(
  collection: string,
  callback: (data: any) => void,
  filters?: { field: string; operator: any; value: any }[]
) {
  let query: admin.firestore.Query = db.collection(collection);

  // Apply filters if provided
  if (filters) {
    filters.forEach(filter => {
      query = query.where(filter.field, filter.operator, filter.value);
    });
  }

  return query.onSnapshot(
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        callback({
          type: change.type, // 'added', 'modified', or 'removed'
          id: change.doc.id,
          data: change.doc.data()
        });
      });
    },
    (error) => {
      logger.error(`Error in Firestore listener for ${collection}:`, error);
    }
  );
}

/**
 * Update document in Firestore
 */
export async function updateDocument(
  collection: string,
  docId: string,
  data: any
): Promise<void> {
  try {
    await db.collection(collection).doc(docId).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    logger.debug(`Updated ${collection}/${docId}`);
  } catch (error) {
    logger.error(`Failed to update ${collection}/${docId}:`, error);
    throw error;
  }
}

/**
 * Create document in Firestore
 */
export async function createDocument(
  collection: string,
  data: any
): Promise<string> {
  try {
    const docRef = await db.collection(collection).add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    logger.debug(`Created ${collection}/${docRef.id}`);
    return docRef.id;
  } catch (error) {
    logger.error(`Failed to create document in ${collection}:`, error);
    throw error;
  }
}

/**
 * Batch write to Firestore
 */
export async function batchWrite(operations: Array<{
  type: 'create' | 'update' | 'delete';
  collection: string;
  id?: string;
  data?: any;
}>) {
  const batch = db.batch();

  operations.forEach(op => {
    const ref = op.id 
      ? db.collection(op.collection).doc(op.id)
      : db.collection(op.collection).doc();

    switch (op.type) {
      case 'create':
        batch.set(ref, {
          ...op.data,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        break;
      case 'update':
        batch.update(ref, {
          ...op.data,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        break;
      case 'delete':
        batch.delete(ref);
        break;
    }
  });

  try {
    await batch.commit();
    logger.debug(`Batch write completed: ${operations.length} operations`);
  } catch (error) {
    logger.error('Batch write failed:', error);
    throw error;
  }
}

// Export instances for direct use
export { db, auth };