
import { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  signOut, 
  getIdToken,
  createUserWithEmailAndPassword,
  AuthError
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { User } from "../types";
import { toast } from "sonner";
import { logAuthActivity } from "../services/activityService";

// Helper function to normalize role names
const normalizeRole = (role: string): User['role'] => {
  const normalizedRole = role?.toLowerCase();
  switch (normalizedRole) {
    case 'admin': return 'Admin';
    case 'operations': return 'Operations';
    case 'finance': return 'Finance';
    case 'rider-applicant': return 'Rider-Applicant';
    default: return role as User['role'];
  }
};

export const useFirebaseAuth = () => {
  const [loading, setLoading] = useState<boolean>(false);
  
  const loginWithFirebase = async (email: string, password: string): Promise<User | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      try {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Ensure the user data matches our User interface
          const user: User = {
            id: userData.id || firebaseUser.uid,
            email: userData.email || firebaseUser.email || '',
            name: userData.name || userData.displayName || '',
            role: normalizeRole(userData.role)
          };
          
          // Get fresh token with claims
          await firebaseUser.getIdToken(true);
          
          // Log successful login
          await logAuthActivity('login', firebaseUser.uid, user.email);
          
          // Store user display name for activity logging
          localStorage.setItem('userDisplayName', user.name);
          
          setLoading(false);
          return user;
        } else {
          // User document doesn't exist in Firestore
          console.error("User document not found in Firestore");
          setLoading(false);
          return null;
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
        return null;
      }
    } catch (error) {
      const firebaseError = error as AuthError;
      let errorMessage = "Invalid email or password";
      
      if (firebaseError.code === 'auth/invalid-credential') {
        errorMessage = "Invalid credentials. Please check your email and password.";
      } else if (firebaseError.code === 'auth/user-not-found') {
        errorMessage = "User not found. Please contact your administrator.";
      } else if (firebaseError.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again.";
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format.";
      } else if (firebaseError.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection.";
      }
      
      toast.error("Login failed", {
        description: errorMessage,
      });
      
      setLoading(false);
      return null;
    }
  };

  const registerWithFirebase = async (name: string, email: string, password: string, role: User['role']): Promise<User | null> => {
    setLoading(true);
    try {
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Create user data
      const userData: User = {
        id: firebaseUser.uid,
        email: email,
        name: name,
        role: role
      };
      
      // Store user data in Firestore
      await setDoc(doc(db, "users", firebaseUser.uid), userData);
      
      setLoading(false);
      return userData;
    } catch (error) {
      const firebaseError = error as AuthError;
      let errorMessage = "Failed to create account";
      
      if (firebaseError.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already in use.";
      } else if (firebaseError.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format.";
      } else if (firebaseError.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please use a stronger password.";
      } else if (firebaseError.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection.";
      }
      
      toast.error("Registration failed", {
        description: errorMessage,
      });
      
      setLoading(false);
      return null;
    }
  };

  const logoutFromFirebase = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await logAuthActivity('logout', currentUser.uid, currentUser.email || 'unknown');
      }
      await signOut(auth);
      localStorage.removeItem('userDisplayName');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return {
    loginWithFirebase,
    registerWithFirebase,
    logoutFromFirebase,
    loading
  };
};
