import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * A callable Cloud Function to set a custom user role.
 *
 * This function must be called by an authenticated user who is already an Admin.
 * It takes a target `userId` and a `role` to assign.
 */
export const setUserRole = functions.https.onCall(async (data, context) => {
  // 1. Validate the input data from the client first
  const { userId, role } = data;
  const validRoles = ["Admin", "Operations", "Finance", "Rider", "Rider-Applicant"];
  if (typeof userId !== "string" || !validRoles.includes(role)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a valid 'userId' and 'role'."
    );
  }

  // 2. Check if the caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to perform this action."
    );
  }

  // 3. Check if the caller is an Admin
  const callerRole = context.auth.token.role;
  if (callerRole !== "Admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You must be an Admin to set user roles."
    );
  }
  // 4. Set the custom claim on the target user.
  try {
    await admin.auth().setCustomUserClaims(userId, { role: role });
    return {
      message: `Success! User ${userId} has been given the role of ${role}.`,
    };
  } catch (error) {
    console.error("Error setting custom claims:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An internal error occurred while setting the user role."
    );
  }
});

/**
 * Cloud Function triggered when a user document is created in Firestore.
 * Automatically sets Firebase Auth custom claims based on the user's role.
 */
export const onUserCreated = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    try {
      const userData = snap.data();
      const userId = context.params.userId;

      console.log(`Setting custom claims for new user: ${userData.email} (${userData.role})`);

      // Set custom claims based on the user's role
      await admin.auth().setCustomUserClaims(userId, {
        role: userData.role
      });

      console.log(`Successfully set custom claims for ${userData.email}: role = ${userData.role}`);
      
    } catch (error) {
      console.error("Error setting custom claims for new user:", error);
    }
  });

/**
 * Cloud Function triggered when a user document is updated in Firestore.
 * Updates Firebase Auth custom claims if the role has changed.
 */
export const onUserUpdated = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      const userId = context.params.userId;

      // Check if the role has changed
      if (beforeData.role !== afterData.role) {
        console.log(`Updating custom claims for user: ${afterData.email} (${beforeData.role} -> ${afterData.role})`);

        // Update custom claims
        await admin.auth().setCustomUserClaims(userId, {
          role: afterData.role
        });

        console.log(`Successfully updated custom claims for ${afterData.email}: role = ${afterData.role}`);
      }
      
    } catch (error) {
      console.error("Error updating custom claims for user:", error);
    }
  });