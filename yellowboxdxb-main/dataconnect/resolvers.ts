import { defineResolver, getFirestore } from '@google-cloud/dataconnect';

/**
 * Resolver for the `expenses` field on the `Rider` type.
 * When a query asks for a rider's expenses, this function is called.
 * It fetches all expenses from the 'expenses' collection where the
 * `riderId` matches the parent rider's ID.
 */
export const riderExpenses = defineResolver('Rider.expenses', {
  async handler(parent) {
    const db = getFirestore();
    const snapshot = await db.collection('expenses').where('riderId', '==', parent.id).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
});

/**
 * Resolver for the `rider` field on the `Expense` type.
 * When a query asks for the rider associated with an expense, this
 * function is called. It uses the `riderId` stored on the expense
 * document to fetch the corresponding rider from the 'riders' collection.
 */
export const expenseRider = defineResolver('Expense.rider', {
  async handler(parent) {
    // The parent is the Expense object, which has a riderId field.
    if (!parent.riderId) {
      return null;
    }
    const db = getFirestore();
    const riderDoc = await db.collection('riders').doc(parent.riderId).get();
    if (!riderDoc.exists) {
      // Handle cases where the rider might have been deleted.
      return null;
    }
    return { id: riderDoc.id, ...riderDoc.data() };
  }
});

/**
 * Resolver for the `bike` field on the `Rider` type.
 * When a query asks for a rider's assigned bike, this function is called.
 * It uses the `bikeId` stored on the rider document to fetch the
 * corresponding bike from the 'bikes' collection.
 */
export const riderBike = defineResolver('Rider.bike', {
  async handler(parent) {
    if (!parent.bikeId) {
      return null; // Rider has no assigned bike.
    }
    const db = getFirestore();
    const bikeDoc = await db.collection('bikes').doc(parent.bikeId).get();
    if (!bikeDoc.exists) {
      console.error(`Data inconsistency: Rider ${parent.id} has a bikeId ${parent.bikeId} that does not exist.`);
      return null;
    }
    return { id: bikeDoc.id, ...bikeDoc.data() };
  }
});

/**
 * Resolver for the `history` field on the `Bike` type.
 * This fetches all historical events for a given bike from the `bikeEvents`
 * collection, ordered by when they occurred.
 */
export const bikeHistory = defineResolver('Bike.history', {
  async handler(parent) { // parent is the Bike object
    const db = getFirestore();
    const eventsSnapshot = await db.collection('bikeEvents')
      .where('bikeId', '==', parent.id)
      .orderBy('timestamp', 'desc')
      .get();

    return eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
});

/**
 * Resolver for the `rider` field on the `BikeEvent` type.
 * If a bike event has a `riderId`, this function is called to fetch the
 * full rider object.
 */
export const bikeEventRider = defineResolver('BikeEvent.rider', {
  async handler(parent) { // parent is the BikeEvent object
    if (!parent.riderId) {
      return null;
    }
    const db = getFirestore();
    const riderDoc = await db.collection('riders').doc(parent.riderId).get();

    if (!riderDoc.exists) {
      // The rider might have been deleted, which is valid.
      return null;
    }
    return { id: riderDoc.id, ...riderDoc.data() };
  }
});

/**
 * Resolver for the `activityHistory` field on the `Rider` type.
 * This creates a unified, chronological feed of a rider's activities
 * by fetching and combining their expenses and bike-related events.
 */
export const riderActivityHistory = defineResolver('Rider.activityHistory', {
  async handler(parent) {
    const db = getFirestore();
    const riderId = parent.id;

    // Fetch all related events in parallel for efficiency.
    const expensesPromise = db.collection('expenses').where('riderId', '==', riderId).get();
    const bikeEventsPromise = db.collection('bikeEvents').where('riderId', '==', riderId).get();
    const riderEventsPromise = db.collection('riderEvents').where('riderId', '==', riderId).get();

    const [expensesSnapshot, bikeEventsSnapshot, riderEventsSnapshot] = await Promise.all([
      expensesPromise,
      bikeEventsPromise,
      riderEventsPromise,
    ]);

    const activities: any[] = [];

    // Add expenses to the activity list.
    expensesSnapshot.docs.forEach(doc => {
      activities.push({
        __typename: 'Expense', // Required for GraphQL Union types
        sortTimestamp: doc.data().createdAt, // Use a consistent key for sorting
        ...doc.data(),
        id: doc.id,
      });
    });

    // Add bike events to the activity list.
    bikeEventsSnapshot.docs.forEach(doc => {
      activities.push({
        __typename: 'BikeEvent',
        sortTimestamp: doc.data().timestamp,
        ...doc.data(),
        id: doc.id,
      });
    });

    // Add rider events to the activity list.
    riderEventsSnapshot.docs.forEach(doc => {
      activities.push({
        __typename: 'RiderEvent',
        sortTimestamp: doc.data().timestamp,
        ...doc.data(),
        id: doc.id,
      });
    });

    // Sort all activities chronologically, with the most recent first.
    activities.sort((a, b) => b.sortTimestamp.toMillis() - a.sortTimestamp.toMillis());

    return activities;
  },
});