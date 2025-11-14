import { useState } from "react";
import { supabase } from "../config/supabase";
import { User } from "../types";
import { toast } from "sonner";

// Helper function to normalize role names
// Keep roles lowercase to match database constraint
const normalizeRole = (role: string): User['role'] => {
  const normalizedRole = role?.toLowerCase();
  switch (normalizedRole) {
    case 'admin': return 'admin';
    case 'operations': return 'operations';
    case 'finance': return 'finance';
    case 'rider':
    case 'rider-applicant': return 'rider';
    default: return role as User['role'];
  }
};

export const useSupabaseAuth = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const loginWithSupabase = async (email: string, password: string): Promise<User | null> => {
    setLoading(true);
    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Authentication failed - no user returned");
      }

      // Fetch user profile from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        console.error("Error fetching user profile:", userError);
        // If user profile doesn't exist, create basic user object from auth data
        const basicUser: User = {
          id: authData.user.id,
          email: authData.user.email || email,
          name: authData.user.user_metadata?.name || email.split('@')[0],
          role: 'Rider-Applicant' // Default role
        };

        // Try to create user profile
        const { error: insertError } = await supabase
          .from('users')
          .insert([basicUser]);

        if (insertError) {
          console.error("Error creating user profile:", insertError);
        }

        setLoading(false);
        return basicUser;
      }

      // Map database user to User type
      const user: User = {
        id: userData.id,
        email: userData.email || authData.user.email || '',
        name: userData.name || userData.full_name || authData.user.user_metadata?.name || '',
        role: normalizeRole(userData.role || 'Rider-Applicant')
      };

      // Store user display name for activity logging
      localStorage.setItem('userDisplayName', user.name);

      // Log successful login to activity table
      try {
        await supabase
          .from('activity_logs')
          .insert([{
            user_id: user.id,
            action: 'login',
            email: user.email,
            timestamp: new Date().toISOString()
          }]);
      } catch (logError) {
        console.error("Error logging activity:", logError);
      }

      setLoading(false);
      return user;
    } catch (error: any) {
      let errorMessage = "Invalid email or password";

      // Handle Supabase-specific error codes
      if (error.message) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = "Invalid credentials. Please check your email and password.";
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = "Please confirm your email address before logging in.";
        } else if (error.message.includes('User not found')) {
          errorMessage = "User not found. Please contact your administrator.";
        } else if (error.message.includes('Network')) {
          errorMessage = "Network error. Please check your connection.";
        } else {
          errorMessage = error.message;
        }
      }

      toast.error("Login failed", {
        description: errorMessage,
      });

      setLoading(false);
      return null;
    }
  };

  const registerWithSupabase = async (
    name: string,
    email: string,
    password: string,
    role: User['role']
  ): Promise<User | null> => {
    setLoading(true);
    try {
      // Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            role: role
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Registration failed - no user returned");
      }

      // Create user profile in users table
      const userData: User = {
        id: authData.user.id,
        email: email,
        name: name,
        role: role
      };

      const { error: insertError } = await supabase
        .from('users')
        .insert([userData]);

      if (insertError) {
        console.error("Error creating user profile:", insertError);
        // Continue anyway - the user is created in Auth
      }

      setLoading(false);
      return userData;
    } catch (error: any) {
      let errorMessage = "Failed to create account";

      // Handle Supabase-specific error codes
      if (error.message) {
        if (error.message.includes('already registered')) {
          errorMessage = "This email is already in use.";
        } else if (error.message.includes('Invalid email')) {
          errorMessage = "Invalid email format.";
        } else if (error.message.includes('Password')) {
          errorMessage = "Password is too weak. Please use a stronger password.";
        } else if (error.message.includes('Network')) {
          errorMessage = "Network error. Please check your connection.";
        } else {
          errorMessage = error.message;
        }
      }

      toast.error("Registration failed", {
        description: errorMessage,
      });

      setLoading(false);
      return null;
    }
  };

  const logoutFromSupabase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Log logout activity
        try {
          await supabase
            .from('activity_logs')
            .insert([{
              user_id: user.id,
              action: 'logout',
              email: user.email || 'unknown',
              timestamp: new Date().toISOString()
            }]);
        } catch (logError) {
          console.error("Error logging activity:", logError);
        }
      }

      await supabase.auth.signOut();
      localStorage.removeItem('userDisplayName');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return {
    loginWithSupabase,
    registerWithSupabase,
    logoutFromSupabase,
    loading
  };
};
