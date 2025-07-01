
import { useState, useEffect, useContext, ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { User } from "../types";
import { toast } from "@/components/ui/use-toast";
import { AuthContext, AuthContextType } from "../contexts/auth-context";
import { getRoleChecker } from "../utils/auth-utils";
import { useFirebaseAuth } from "./use-firebase-auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  const { loginWithFirebase, logoutFromFirebase, registerWithFirebase, loading: firebaseLoading } = useFirebaseAuth();
  
  // Role check helpers
  const { isAdmin, isOperations, isFinance, isRider } = getRoleChecker(currentUser);

  // Check Firebase auth state on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            
            // Get fresh token with claims
            await firebaseUser.getIdToken(true);
            
            setCurrentUser(userData);
            setIsAuthenticated(true);
          } else {
            // User document doesn't exist in Firestore
            console.error("User document not found in Firestore");
            setCurrentUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const firebaseUser = await loginWithFirebase(email, password);
    
    if (firebaseUser) {
      setCurrentUser(firebaseUser);
      setIsAuthenticated(true);
      return true;
    }
    
    return false;
  };

  const register = async (name: string, email: string, password: string, role: User['role']): Promise<boolean> => {
    const firebaseUser = await registerWithFirebase(name, email, password, role);
    
    if (firebaseUser) {
      setCurrentUser(firebaseUser);
      setIsAuthenticated(true);
      return true;
    }
    
    return false;
  };

  const logout = async () => {
    await logoutFromFirebase();
    // Firebase Auth state change will handle clearing the user
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        currentUser, 
        login, 
        logout, 
        register,
        isAdmin, 
        isOperations, 
        isFinance, 
        isRider,
        loading: loading || firebaseLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
