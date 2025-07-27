import { defineMutation, defineQuery, getFirestore } from '@google-cloud/dataconnect';
import { z } from 'zod';
import { Timestamp, FieldValue, runTransaction } from 'firebase-admin/firestore';
import { APPLICATION_STAGES, RIDER_EVENT_TYPES } from './constants';
import { getAuthenticatedUser } from './auth';

/**
 * Zod schema for validating the input for creating a new rider.
 * This is based on the requirements in `rider-management/tasks.md`,
 * which mentions Zod validation schemas.
 */
const createRiderInputSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters long" }),
  email: z.string().email({ message: "Invalid email address" }),
  phone: z.string().min(8, { message: "Phone number seems too short" }),
  nationality: z.string().optional(),
  bikeType: z.string().optional(),
  visaNumber: z.string().optional(),
});

/**
 * Defines the `createRider` mutation.
 * This mutation handles the creation of a new rider document in Firestore.
 * It validates the input and sets the initial application stage to 'APPLIED'.
 */
export const createRider = defineMutation('createRider', {
  // Use Zod for runtime validation of the input from the client.
  input: createRiderInputSchema,

  // The handler function that contains the business logic for the mutation.
  async handler(input, context) {
    const authenticatedUser = getAuthenticatedUser(context);

    // Authorization check: Only Admin or Operations can create riders.
    if (authenticatedUser.role !== 'Admin' && authenticatedUser.role !== 'Operations') {
      throw new Error('PERMISSION_DENIED: You do not have permission to create riders.');
    }

    const db = getFirestore();
    const ridersRef = db.collection('riders');

    const now = Timestamp.now();
    const newRiderData = {
      ...input,
      applicationStage: 'APPLIED', // Set the initial stage for a new rider.
      // Set default values for fields required by the frontend component.
      joinDate: now,
      testStatus: {
        theory: 'Pending',
        road: 'Pending',
      },
      bikeId: null, // Explicitly set bikeId to null on creation.
      documents: [], // Initialize with an empty documents array.
      createdAt: now,
      updatedAt: now,
    };

    // Add the new rider data to the 'riders' collection.
    const docRef = await ridersRef.add(newRiderData);

    // Return the newly created rider document, including its new ID.
    return {
      id: docRef.id,
      ...newRiderData,
    };
  },
});

/**
 * Zod schema for adding a new document to a rider.
 */
const addRiderDocumentInputSchema = z.object({
  riderId: z.string(),
  documentUrl: z.string().url(),
  documentType: z.enum(['PASSPORT', 'VISA', 'TEST_CERTIFICATE', 'MEDICAL_CERT', 'EMIRATES_ID']),
  expiryDate: z.instanceof(Timestamp).optional(),
});

/**
 * Defines the `addRiderDocument` mutation.
 * This handles adding a new document reference to a rider's record.
 */
export const addRiderDocument = defineMutation('addRiderDocument', {
  input: addRiderDocumentInputSchema,
  async handler(input, context) {
    const authenticatedUser = getAuthenticatedUser(context);

    // A rider can upload their own documents, or an Admin/Operations can.
    if (authenticatedUser.role !== 'Rider' && authenticatedUser.role !== 'Admin' && authenticatedUser.role !== 'Operations') {
      throw new Error('PERMISSION_DENIED: You do not have permission to add documents.');
    }

    const db = getFirestore();
    const riderRef = db.collection('riders').doc(input.riderId);

    const newDocument = {
      documentUrl: input.documentUrl,
      documentType: input.documentType,
      verified: false, // Documents are not verified by default.
      expiryDate: input.expiryDate || null,
      uploadedAt: Timestamp.now(),
    };

    // Atomically add the new document to the 'documents' array field.
    await riderRef.update({
      documents: FieldValue.arrayUnion(newDocument),
      updatedAt: Timestamp.now(),
    });

    // Create a historical event for the document upload.
    await db.collection('riderEvents').add({
      riderId: input.riderId,
      eventType: 'DOCUMENT_UPLOAD',
      timestamp: newDocument.uploadedAt,
      notes: `Document '${input.documentType}' was uploaded.`
    });

    // Fetch and return the updated rider document.
    const updatedDoc = await riderRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  },
});

/**
 * Zod schema for verifying a rider's document.
 */
const verifyRiderDocumentInputSchema = z.object({
  riderId: z.string(),
  documentUrl: z.string().url({ message: "A valid document URL is required to identify the document." }),
  isVerified: z.boolean(),
});

/**
 * Defines the `verifyRiderDocument` mutation.
 * This allows the Operations team to approve or reject a rider's document,
 * fulfilling a key requirement from the training presentation.
 */
export const verifyRiderDocument = defineMutation('verifyRiderDocument', {
  input: verifyRiderDocumentInputSchema,
  async handler(input, context) {
    const authenticatedUser = getAuthenticatedUser(context);

    if (authenticatedUser.role !== 'Admin' && authenticatedUser.role !== 'Operations') {
      throw new Error('PERMISSION_DENIED: You do not have permission to verify documents.');
    }

    const db = getFirestore();
    const riderRef = db.collection('riders').doc(input.riderId);
    const riderDoc = await riderRef.get();

    if (!riderDoc.exists) {
      throw new Error(`Rider with ID ${input.riderId} not found.`);
    }

    const riderData = riderDoc.data();
    const documents = riderData.documents || [];

    const docIndex = documents.findIndex(doc => doc.documentUrl === input.documentUrl);

    if (docIndex === -1) {
      throw new Error(`Document with URL ${input.documentUrl} not found for this rider.`);
    }

    // Update the 'verified' status of the specific document.
    documents[docIndex].verified = input.isVerified;

    // Update the entire documents array in Firestore.
    await riderRef.update({
      documents: documents,
      updatedAt: Timestamp.now(),
    });

    // Create a historical event for the verification.
    await db.collection('riderEvents').add({
      riderId: input.riderId,
      eventType: 'DOCUMENT_VERIFICATION',
      timestamp: Timestamp.now(),
      notes: `Document with URL ${input.documentUrl} was ${input.isVerified ? 'verified' : 'marked as unverified'}.`
    });

    // Return the full, updated rider object.
    const updatedRiderDoc = await riderRef.get();
    return { id: updatedRiderDoc.id, ...updatedRiderDoc.data() };
  },
});

/**
 * Zod schema for updating a rider's status.
 */
const updateRiderStatusInputSchema = z.object({
  riderId: z.string(),
  applicationStage: z.enum(APPLICATION_STAGES).optional(),
  testStatus: z.object({
    theory: z.string().optional(),
    road: z.string().optional(),
  }).optional(),
});

/**
 * Defines the `updateRiderStatus` mutation.
 * This is a critical function for the Operations team, allowing them to
 * move a rider through the application pipeline and creating a historical event.
 */
export const updateRiderStatus = defineMutation('updateRiderStatus', {
  input: updateRiderStatusInputSchema,
  async handler(input, context) {
    const authenticatedUser = getAuthenticatedUser(context);

    if (authenticatedUser.role !== 'Admin' && authenticatedUser.role !== 'Operations') {
      throw new Error('PERMISSION_DENIED: You do not have permission to update rider status.');
    }

    const db = getFirestore();
    const riderRef = db.collection('riders').doc(input.riderId);

    const riderDoc = await riderRef.get();
    if (!riderDoc.exists) {
      throw new Error(`Rider with ID ${input.riderId} not found.`);
    }
    const oldData = riderDoc.data();

    const updateData: { [key: string]: any } = { updatedAt: Timestamp.now() };
    const notes: string[] = [];

    if (input.applicationStage && input.applicationStage !== oldData.applicationStage) {
      updateData.applicationStage = input.applicationStage;
      notes.push(`Application stage changed from ${oldData.applicationStage} to ${input.applicationStage}.`);
    }
    if (input.testStatus?.theory && input.testStatus.theory !== oldData.testStatus?.theory) {
      updateData['testStatus.theory'] = input.testStatus.theory;
      notes.push(`Theory test status updated to: ${input.testStatus.theory}.`);
    }
    if (input.testStatus?.road && input.testStatus.road !== oldData.testStatus?.road) {
      updateData['testStatus.road'] = input.testStatus.road;
      notes.push(`Road test status updated to: ${input.testStatus.road}.`);
    }

    if (notes.length === 0) {
      throw new Error("No new status provided to update or status is the same.");
    }

    await riderRef.update(updateData);

    await db.collection('riderEvents').add({
      riderId: input.riderId,
      eventType: 'STATUS_CHANGE',
      timestamp: updateData.updatedAt,
      notes: notes.join(' '),
    });

    const updatedDoc = await riderRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  },
});

/**
 * Zod schema for assigning a bike to a rider.
 */
const assignBikeToRiderInputSchema = z.object({
  riderId: z.string(),
  bikeId: z.string(),
});

/**
 * Defines the `assignBikeToRider` mutation.
 * This transactionally assigns a bike to a rider, ensuring data consistency.
 * It includes business logic checks based on the training presentation.
 */
export const assignBikeToRider = defineMutation('assignBikeToRider', {
  input: assignBikeToRiderInputSchema,
  async handler(input, context) {
    const authenticatedUser = getAuthenticatedUser(context);

    if (authenticatedUser.role !== 'Admin' && authenticatedUser.role !== 'Operations') {
      throw new Error('PERMISSION_DENIED: You do not have permission to assign bikes.');
    }

    const db = getFirestore();

    try {
      const updatedRider = await runTransaction(db, async (transaction) => {
        const riderRef = db.collection('riders').doc(input.riderId);
        const bikeRef = db.collection('bikes').doc(input.bikeId);

        const [riderDoc, bikeDoc] = await transaction.getAll(riderRef, bikeRef);

        if (!riderDoc.exists) {
          throw new Error(`Rider with ID ${input.riderId} not found.`);
        }
        if (!bikeDoc.exists) {
          throw new Error(`Bike with ID ${input.bikeId} not found.`);
        }

        const riderData = riderDoc.data();
        const bikeData = bikeDoc.data();

        if (riderData.applicationStage !== 'ID_ISSUED' && riderData.applicationStage !== 'ACTIVE') {
          throw new Error(`Rider must be at 'ID_ISSUED' or 'ACTIVE' stage. Current stage: ${riderData.applicationStage}`);
        }
        if (riderData.bikeId) {
          throw new Error(`Rider ${riderData.fullName} is already assigned to bike ${riderData.bikeId}.`);
        }
        if (bikeData.status !== 'AVAILABLE') {
          throw new Error(`Bike ${bikeData.registrationNumber} is not available. Current status: ${bikeData.status}`);
        }

        transaction.update(riderRef, { bikeId: input.bikeId, updatedAt: Timestamp.now() });
        transaction.update(bikeRef, { status: 'ASSIGNED', riderId: input.riderId });

        // Create a historical event log for the assignment.
        const eventRef = db.collection('bikeEvents').doc();
        transaction.set(eventRef, {
          bikeId: input.bikeId,
          riderId: input.riderId,
          eventType: 'ASSIGNED',
          timestamp: Timestamp.now(),
          notes: `Assigned to ${riderData.fullName}.`
        });

        return {
          id: riderDoc.id,
          ...riderData,
          bikeId: input.bikeId,
        };
      });
      return updatedRider;
    } catch (e) {
      console.error("Bike assignment transaction failed: ", e);
      throw e;
    }
  },
});

/**
 * Zod schema for unassigning a bike from a rider.
 */
const unassignBikeFromRiderInputSchema = z.object({
  riderId: z.string(),
});

/**
 * Defines the `unassignBikeFromRider` mutation.
 * This transactionally unassigns a bike from a rider, ensuring data consistency
 * by updating both the rider and bike documents.
 */
export const unassignBikeFromRider = defineMutation('unassignBikeFromRider', {
  input: unassignBikeFromRiderInputSchema,
  async handler(input, context) {
    const authenticatedUser = getAuthenticatedUser(context);

    if (authenticatedUser.role !== 'Admin' && authenticatedUser.role !== 'Operations') {
      throw new Error('PERMISSION_DENIED: You do not have permission to unassign bikes.');
    }

    const db = getFirestore();

    try {
      const updatedRider = await runTransaction(db, async (transaction) => {
        const riderRef = db.collection('riders').doc(input.riderId);
        const riderDoc = await transaction.get(riderRef);

        if (!riderDoc.exists) {
          throw new Error(`Rider with ID ${input.riderId} not found.`);
        }

        const riderData = riderDoc.data();
        const bikeId = riderData.bikeId;

        if (!bikeId) {
          // This rider doesn't have a bike, so there's nothing to do.
          // We can return early without error.
          return { id: riderDoc.id, ...riderData };
        }

        const bikeRef = db.collection('bikes').doc(bikeId);

        // Update both documents within the transaction.
        transaction.update(riderRef, { bikeId: null, updatedAt: Timestamp.now() });
        transaction.update(bikeRef, { status: 'AVAILABLE', riderId: null });

        // Create a historical event log for the unassignment.
        const eventRef = db.collection('bikeEvents').doc();
        transaction.set(eventRef, {
          bikeId: bikeId,
          riderId: input.riderId,
          eventType: 'UNASSIGNED',
          timestamp: Timestamp.now(),
          notes: `Unassigned from ${riderData.fullName}.`
        });

        // Return the updated rider data, reflecting the unassignment.
        return {
          id: riderDoc.id,
          ...riderData,
          bikeId: null,
        };
      });
      return updatedRider;
    } catch (e) {
      console.error("Bike unassignment transaction failed: ", e);
      // Re-throw the error to be sent to the client.
      throw e;
    }
  },
});

/**
 * Zod schema for validating the input for the riders query.
 * The applicationStage is optional and must be one of the predefined enum values.
 */
const ridersQueryInputSchema = z.object({
  applicationStage: z.enum(APPLICATION_STAGES).optional(),
});

/**
 * Defines the `riders` query.
 * This query lists riders from Firestore and allows filtering by applicationStage.
 */
export const riders = defineQuery('riders', {
  // Use Zod for runtime validation of the query arguments.
  input: ridersQueryInputSchema,

  // The handler function that contains the business logic for the query.
  async handler(input, context) {
    getAuthenticatedUser(context); // Any authenticated user can view the list.
    const db = getFirestore();
    let query: FirebaseFirestore.Query = db.collection('riders');

    // If an applicationStage is provided, add a 'where' clause to the query.
    if (input?.applicationStage) {
      query = query.where('applicationStage', '==', input.applicationStage);
    }

    const snapshot = await query.get();

    // Map the Firestore documents to the Rider GraphQL type.
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // The returned object must match the structure of the Rider type in schema.gql.
      return { id: doc.id, ...data };
    });
  },
});

/**
 * Defines the `unassignedActiveRiders` query.
 * This query is designed to help the Operations team easily find riders
 * who are active and ready for a bike assignment.
 */
export const unassignedActiveRiders = defineQuery('unassignedActiveRiders', {
  // This query takes no input.
  async handler(input, context) {
    getAuthenticatedUser(context);
    const db = getFirestore();
    const ridersRef = db.collection('riders');

    // Create a query to find riders who are 'ACTIVE' and have no 'bikeId'.
    const q = ridersRef
      .where('applicationStage', '==', 'ACTIVE')
      .where('bikeId', '==', null);

    const snapshot = await q.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
});

/**
 * Zod schema for fetching a single rider by ID.
 */
const riderQueryInputSchema = z.object({
  id: z.string().min(1, { message: "Rider ID cannot be empty." }),
});

/**
 * Defines the `rider` query.
 * This fetches a single rider document by its unique ID. It returns null
 * if no rider with the given ID is found.
 */
export const rider = defineQuery('rider', {
  input: riderQueryInputSchema,
  async handler(input, context) {
    getAuthenticatedUser(context);
    const db = getFirestore();
    const riderRef = db.collection('riders').doc(input.id);
    const riderDoc = await riderRef.get();

    if (!riderDoc.exists) {
      return null;
    }

    // The field resolvers for `bike` and `expenses` will handle fetching
    // those related entities when requested in the client query.
    return { id: riderDoc.id, ...riderDoc.data() };
  },
});

/**
 * Zod schema for the ridersWithExpiringDocuments query.
 */
const expiringDocumentsInputSchema = z.object({
  daysUntilExpiry: z.number().int().positive({ message: "daysUntilExpiry must be a positive integer." }),
});

/**
 * Defines the `ridersWithExpiringDocuments` query.
 * This finds active riders with documents that will expire between now and
 * the specified number of days from now.
 */
export const ridersWithExpiringDocuments = defineQuery('ridersWithExpiringDocuments', {
  input: expiringDocumentsInputSchema,
  async handler(input, context) {
    getAuthenticatedUser(context);
    const db = getFirestore();

    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() + input.daysUntilExpiry);

    // We only care about documents for active riders.
    const activeRidersSnapshot = await db.collection('riders')
      .where('applicationStage', '==', 'ACTIVE')
      .get();

    const ridersWithExpiringDocs = [];

    for (const doc of activeRidersSnapshot.docs) {
      const rider = { id: doc.id, ...doc.data() };
      const hasExpiringDoc = (rider.documents || []).some(document => {
        if (!document.expiryDate) {
          return false;
        }
        const expiry = document.expiryDate.toDate();
        return expiry > now && expiry <= thresholdDate;
      });

      if (hasExpiringDoc) {
        ridersWithExpiringDocs.push(rider);
      }
    }

    return ridersWithExpiringDocs;
  },
});

/**
 * Zod schema for deleting a rider.
 */
const deleteRiderInputSchema = z.object({
  riderId: z.string(),
});

/**
 * Defines the `deleteRider` mutation.
 * This transactionally deletes a rider and handles unassigning their bike
 * to ensure data integrity.
 */
export const deleteRider = defineMutation('deleteRider', {
  input: deleteRiderInputSchema,
  async handler(input, context) {
    const authenticatedUser = getAuthenticatedUser(context);

    if (authenticatedUser.role !== 'Admin') {
      throw new Error('PERMISSION_DENIED: Only Admins can delete riders.');
    }

    const db = getFirestore();

    try {
      const deletedRiderData = await runTransaction(db, async (transaction) => {
        const riderRef = db.collection('riders').doc(input.riderId);
        const riderDoc = await transaction.get(riderRef);

        if (!riderDoc.exists) {
          throw new Error(`Rider with ID ${input.riderId} not found.`);
        }

        const riderData = riderDoc.data();
        const bikeId = riderData.bikeId;

        if (bikeId) {
          // If the rider has a bike, we must unassign it.
          const bikeRef = db.collection('bikes').doc(bikeId);
          transaction.update(bikeRef, { status: 'AVAILABLE', riderId: null });

          // Create a historical event log for the unassignment.
          const eventRef = db.collection('bikeEvents').doc();
          transaction.set(eventRef, {
            bikeId: bikeId,
            riderId: input.riderId,
            eventType: 'UNASSIGNED',
            timestamp: Timestamp.now(),
            notes: `Bike unassigned because rider ${riderData.fullName} was deleted.`
          });
        }

        transaction.delete(riderRef);
        return { id: riderDoc.id, ...riderData };
      });
      return deletedRiderData;
    } catch (e) {
      console.error("Rider deletion transaction failed: ", e);
      throw e;
    }
  },
});