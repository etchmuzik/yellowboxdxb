import { HandlerContext } from '@google-cloud/dataconnect';

/**
 * Defines the user roles as specified in your project's design documents.
 */
export type UserRole = 'Admin' | 'Operations' | 'Finance' | 'Rider';

/**
 * Represents the authenticated user's data decoded from the Firebase Auth token.
 */
export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role: UserRole;
}

/**
 * Verifies that a user is authenticated and returns their details.
 * This function should be called at the beginning of any protected handler.
 *
 * @param context The handler context provided by Data Connect.
 * @returns The authenticated user's data.
 * @throws An error if the user is not authenticated or has no role.
 */
export function getAuthenticatedUser(context: HandlerContext): AuthenticatedUser {
  if (!context.auth) {
    throw new Error('UNAUTHENTICATED: You must be logged in to perform this action.');
  }

  // Data Connect automatically decodes the token and populates `context.auth`.
  // We expect a 'role' custom claim to be set on the Firebase Auth user.
  const role = context.auth.token.role as UserRole;

  if (!role) {
    throw new Error('PERMISSION_DENIED: User does not have a role assigned.');
  }

  return {
    uid: context.auth.uid,
    email: context.auth.token.email,
    role: role,
  };
}