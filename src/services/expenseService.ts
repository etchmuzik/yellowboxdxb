
import { ExpenseFirestoreService } from "./expenseFirestoreService";
import { SpendEvent, SpendCategory } from "../types";

export const getAllExpenses = async (): Promise<SpendEvent[]> => {
  return await ExpenseFirestoreService.getAllExpenses();
};

export const getExpensesByRider = async (riderId: string): Promise<SpendEvent[]> => {
  return await ExpenseFirestoreService.getExpensesByRider(riderId);
};

export const getExpensesByCategory = async (category: SpendCategory): Promise<SpendEvent[]> => {
  return await ExpenseFirestoreService.getExpensesByCategory(category);
};

export const createExpense = async (expenseData: Omit<SpendEvent, 'id'>): Promise<string> => {
  return await ExpenseFirestoreService.createExpense(expenseData);
};

export const updateExpense = async (expenseId: string, updates: Partial<SpendEvent>): Promise<void> => {
  return await ExpenseFirestoreService.updateExpense(expenseId, updates);
};

export const approveExpense = async (expenseId: string): Promise<void> => {
  return await ExpenseFirestoreService.approveExpense(expenseId);
};

export const deleteExpense = async (expenseId: string): Promise<void> => {
  return await ExpenseFirestoreService.deleteExpense(expenseId);
};
