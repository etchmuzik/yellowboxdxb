
import { createContext } from "react";
import { User } from "../types";

// Define keys for localStorage
export const MOCK_AUTH_KEY = "yellowbox-rider-mock-auth";

export interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: User['role']) => Promise<boolean>;
  isAdmin: () => boolean;
  isOperations: () => boolean;
  isFinance: () => boolean;
  isRider: () => boolean;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
