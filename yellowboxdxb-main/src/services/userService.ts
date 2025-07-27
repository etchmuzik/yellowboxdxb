
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../config/firebase";
import { User } from "../types";

const COLLECTION = "users";

export const getUsers = async (): Promise<User[]> => {
  const usersSnapshot = await getDocs(collection(db, COLLECTION));
  return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(db, COLLECTION, userId));
  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() } as User;
  }
  return null;
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const usersRef = collection(db, COLLECTION);
  const q = query(usersRef, where("email", "==", email));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const userDoc = querySnapshot.docs[0];
    return { id: userDoc.id, ...userDoc.data() } as User;
  }
  return null;
};

export const createUser = async (userData: Omit<User, "id">): Promise<User> => {
  try {
    // Check if user with this email already exists
    const existingUser = await getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }
    
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, "password123");
    const userId = userCredential.user.uid;
    
    // Store user data in Firestore
    await setDoc(doc(db, COLLECTION, userId), userData);
    
    return { id: userId, ...userData };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const updateUser = async (userId: string, userData: Partial<User>): Promise<void> => {
  await updateDoc(doc(db, COLLECTION, userId), userData);
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
