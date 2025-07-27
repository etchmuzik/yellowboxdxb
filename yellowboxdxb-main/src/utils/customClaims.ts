
import { httpsCallable } from "firebase/functions";
import { functions } from "../config/firebase";

// Function to set custom role claims
export const setUserRole = async (userId: string, role: string): Promise<void> => {
  try {
    const setRole = httpsCallable(functions, 'setUserRole');
    await setRole({ userId, role });
  } catch (error) {
    console.error("Error setting user role:", error);
    throw error;
  }
};

// Function to get current user claims
export const getCurrentUserClaims = async (): Promise<unknown> => {
  try {
    const getClaims = httpsCallable(functions, 'getUserClaims');
    const result = await getClaims();
    return result.data;
  } catch (error) {
    console.error("Error getting user claims:", error);
    throw error;
  }
};
