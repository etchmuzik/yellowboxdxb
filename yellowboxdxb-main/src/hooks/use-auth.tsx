
import { useState, useEffect, useContext, ReactNode } from "react";
import { supabase } from "../config/supabase";
import { User } from "../types";
import { toast } from "@/components/ui/use-toast";
import { AuthContext, AuthContextType } from "../contexts/auth-context";
import { getRoleChecker } from "../utils/auth-utils";
import { useSupabaseAuth } from "./use-supabase-auth";

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  const { loginWithSupabase, logoutFromSupabase, registerWithSupabase, loading: supabaseLoading } = useSupabaseAuth();
  
  // Role check helpers
  const { isAdmin, isOperations, isFinance, isRider } = getRoleChecker(currentUser);

  // Check Supabase auth state on mount
  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          // Get user data from Supabase users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userError) {
            console.error("Error fetching user profile:", userError);
            setCurrentUser(null);
            setIsAuthenticated(false);
          } else if (userData) {
            // Map database user to User type
            const user: User = {
              id: userData.id,
              email: userData.email || session.user.email || '',
              name: userData.name || userData.full_name || session.user.user_metadata?.name || '',
              role: normalizeRole(userData.role || 'Rider-Applicant')
            };

            setCurrentUser(user);
            setIsAuthenticated(true);
          } else {
            // User document doesn't exist
            console.error("User profile not found in database");
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          try {
            // Get user data from Supabase users table
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (userError) {
              console.error("Error fetching user profile:", userError);
              setCurrentUser(null);
              setIsAuthenticated(false);
            } else if (userData) {
              // Map database user to User type
              const user: User = {
                id: userData.id,
                email: userData.email || session.user.email || '',
                name: userData.name || userData.full_name || session.user.user_metadata?.name || '',
                role: normalizeRole(userData.role || 'Rider-Applicant')
              };

              setCurrentUser(user);
              setIsAuthenticated(true);
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
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const supabaseUser = await loginWithSupabase(email, password);

    if (supabaseUser) {
      setCurrentUser(supabaseUser);
      setIsAuthenticated(true);
      return true;
    }

    return false;
  };

  const register = async (name: string, email: string, password: string, role: User['role']): Promise<boolean> => {
    const supabaseUser = await registerWithSupabase(name, email, password, role);

    if (supabaseUser) {
      setCurrentUser(supabaseUser);
      setIsAuthenticated(true);
      return true;
    }

    return false;
  };

  const logout = async () => {
    await logoutFromSupabase();
    // Supabase Auth state change will handle clearing the user
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
        loading: loading || supabaseLoading
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
