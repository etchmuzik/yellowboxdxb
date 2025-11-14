
import { User } from "../types";

export const getRoleChecker = (currentUser: User | null) => ({
  isAdmin: () => {
    const role = currentUser?.role?.toLowerCase();
    return role === "admin";
  },
  isOperations: () => {
    const role = currentUser?.role?.toLowerCase();
    return role === "operations";
  },
  isFinance: () => {
    const role = currentUser?.role?.toLowerCase();
    return role === "finance";
  },
  isRider: () => {
    const role = currentUser?.role?.toLowerCase();
    return role === "rider" || role === "rider-applicant";
  },
});
