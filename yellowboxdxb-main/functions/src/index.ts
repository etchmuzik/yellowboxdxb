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
  // 1. Check if the caller is authenticated.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be logged in to perform this action."
    );
  }

  // 2. Check if the caller is an Admin by inspecting their existing custom claims.
  const callerRole = context.auth.token.role;
  if (callerRole !== "Admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "You must be an Admin to set user roles."
    );
  }

  // 3. Validate the input data from the client.
  const { userId, role } = data;
  const validRoles = ["Admin", "Operations", "Finance", "Rider"];
  if (typeof userId !== "string" || !validRoles.includes(role)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a valid 'userId' and 'role'."
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