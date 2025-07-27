import { defineQuery, defineMutation, getFirestore } from '@google-cloud/dataconnect';
import { z } from 'zod';
import { BIKE_STATUSES } from './constants';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Zod schema for validating the input for the bikes query.
 */
const bikesQueryInputSchema = z.object({
  status: z.enum(BIKE_STATUSES).optional(),
}).optional();

/**
 * Defines the `bikes` query.
 * This allows the frontend to fetch a list of all company bikes,
 * for example, to show which ones are 'AVAILABLE' for assignment.
 */
export const bikes = defineQuery('bikes', {
  input: bikesQueryInputSchema,
  async handler(input) {
    const db = getFirestore();
    let query: FirebaseFirestore.Query = db.collection('bikes');

    if (input?.status) {
      query = query.where('status', '==', input.status);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
});

/**
 * Zod schema for creating a new bike.
 */
const createBikeInputSchema = z.object({
  model: z.string().min(2, { message: "Model name must be at least 2 characters long" }),
  registrationNumber: z.string().min(3, { message: "Registration number seems too short" }),
});

/**
 * Defines the `createBike` mutation.
 * This creates a new bike document in Firestore with a default
 * status of 'AVAILABLE'.
 */
export const createBike = defineMutation('createBike', {
  input: createBikeInputSchema,
  async handler(input) {
    const db = getFirestore();

    const newBikeData = {
      ...input,
      status: 'AVAILABLE', // New bikes are available by default.
    };

    const docRef = await db.collection('bikes').add(newBikeData);
    return { id: docRef.id, ...newBikeData };
  },
});

/**
 * Zod schema for deleting a bike.
 */
const deleteBikeInputSchema = z.object({
  bikeId: z.string(),
});

/**
 * Defines the `deleteBike` mutation.
 * This permanently removes a bike from the system.
 * It includes a safety check to prevent deletion of an assigned bike.
 */
export const deleteBike = defineMutation('deleteBike', {
  input: deleteBikeInputSchema,
  async handler(input) {
    const db = getFirestore();
    const bikeRef = db.collection('bikes').doc(input.bikeId);
    const bikeDoc = await bikeRef.get();

    if (!bikeDoc.exists) {
      throw new Error(`Bike with ID ${input.bikeId} not found.`);
    }

    const bikeData = bikeDoc.data();
    if (bikeData.status === 'ASSIGNED') {
      throw new Error(`Cannot delete bike ${bikeData.registrationNumber} because it is currently assigned. Please unassign it first.`);
    }

    await bikeRef.delete();
    return { id: bikeDoc.id, ...bikeData };
  },
});

/**
 * Zod schema for updating a bike's status.
 */
const updateBikeStatusInputSchema = z.object({
  bikeId: z.string(),
  status: z.enum(BIKE_STATUSES),
});

/**
 * Defines the `updateBikeStatus` mutation.
 * This allows for changing a bike's status, such as placing it into
 * or taking it out of maintenance.
 */
export const updateBikeStatus = defineMutation('updateBikeStatus', {
  input: updateBikeStatusInputSchema,
  async handler(input) {
    const db = getFirestore();
    const bikeRef = db.collection('bikes').doc(input.bikeId);
    const bikeDoc = await bikeRef.get();

    if (!bikeDoc.exists) {
      throw new Error(`Bike with ID ${input.bikeId} not found.`);
    }

    const bikeData = bikeDoc.data();
    // Safety check: Prevent updating the status of an assigned bike.
    if (bikeData.status === 'ASSIGNED') {
      throw new Error(`Cannot update status of bike ${bikeData.registrationNumber} because it is currently assigned. Please unassign it first.`);
    }

    const oldStatus = bikeData.status;
    const newStatus = input.status;

    if (oldStatus === newStatus) {
        // No change, just return the current state.
        return { id: bikeDoc.id, ...bikeData };
    }

    // Update the bike's status
    await bikeRef.update({ status: newStatus });

    // Determine the event type and create a historical log
    let eventType;
    let notes;

    if (newStatus === 'MAINTENANCE') {
      eventType = 'MAINTENANCE_START';
      notes = 'Bike placed into maintenance.';
    } else if (oldStatus === 'MAINTENANCE' && newStatus === 'AVAILABLE') {
      eventType = 'MAINTENANCE_END';
      notes = 'Bike returned from maintenance.';
    }

    if (eventType) {
      await db.collection('bikeEvents').add({
        bikeId: input.bikeId,
        eventType: eventType,
        timestamp: Timestamp.now(),
        notes: notes,
      });
    }

    const updatedDoc = await bikeRef.get();
    return { id: updatedDoc.id, ...updatedDoc.data() };
  },
});

/**
 * Defines the `bikeStatusSummary` query.
 * This provides aggregated counts of bikes by their current status,
 * which is useful for an operational dashboard.
 */
export const bikeStatusSummary = defineQuery('bikeStatusSummary', {
  // This query takes no input.
  async handler() {
    const db = getFirestore();
    const snapshot = await db.collection('bikes').get();

    const summary = snapshot.docs.reduce((acc, doc) => {
      const status = doc.data().status;
      if (status === 'AVAILABLE') {
        acc.availableCount++;
      } else if (status === 'ASSIGNED') {
        acc.assignedCount++;
      } else if (status === 'MAINTENANCE') {
        acc.maintenanceCount++;
      }
      return acc;
    }, { availableCount: 0, assignedCount: 0, maintenanceCount: 0 });

    return {
      totalCount: snapshot.size,
      ...summary,
    };
  },
});