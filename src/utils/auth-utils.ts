
import { User } from "../types";

export const getRoleChecker = (currentUser: User | null) => ({
  isAdmin: () => currentUser?.role === "Admin",
  isOperations: () => currentUser?.role === "Operations",
  isFinance: () => currentUser?.role === "Finance",
  isRider: () => currentUser?.role === "Rider-Applicant",
});
