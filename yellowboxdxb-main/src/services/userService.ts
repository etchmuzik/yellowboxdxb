
import { supabase } from "../config/supabase";
import { User } from "../types";

const TABLE_NAME = "users";

export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*');

  if (error) {
    console.error("Error fetching users:", error);
    throw error;
  }

  return data || [];
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error("Error fetching user by ID:", error);
    throw error;
  }

  return data;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error("Error fetching user by email:", error);
    throw error;
  }

  return data;
};

export const createUser = async (userData: Omit<User, "id">): Promise<User> => {
  try {
    // Check if user with this email already exists
    const existingUser = await getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create Supabase Auth user first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: "password123", // Default password - user should change it
      options: {
        data: {
          name: userData.name,
          role: userData.role
        }
      }
    });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error("Failed to create auth user");
    }

    const userId = authData.user.id;

    // Store user profile in database
    const { data: insertedUser, error: insertError } = await supabase
      .from(TABLE_NAME)
      .insert([{ id: userId, ...userData }])
      .select()
      .single();

    if (insertError) {
      console.error("Error creating user profile:", insertError);
      throw insertError;
    }

    return insertedUser;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .update(userData)
    .eq('id', userId);

  if (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const validateUserRegistration = (email: string, role: User['role'], currentUser: User | null): boolean => {
  // Check if the user has permission to create users of the specified role
  if (role === "Admin" || role === "Operations") {
    // Only admin can create other admin or operations users
    return currentUser?.role === "Admin";
  }
  
  if (role === "Finance") {
    // Only admin can create finance users
    return currentUser?.role === "Admin";
  }
  
  // Anyone can create rider accounts, no validation needed
  return true;
};
