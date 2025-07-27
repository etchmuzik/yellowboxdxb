
import { ExpenseFirestoreService } from "./expenseFirestoreService";
import { SpendEvent, SpendCategory } from "../types";
import { triggerSync } from "./webhookService";

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
  const expenseId = await ExpenseFirestoreService.createExpense(expenseData);
  
  // Trigger webhook for N8N sync
  await triggerSync('expense', expenseId, 'created', { ...expenseData, id: expenseId });
  
  return expenseId;
};

export const updateExpense = async (expenseId: string, updates: Partial<SpendEvent>): Promise<void> => {
  await ExpenseFirestoreService.updateExpense(expenseId, updates);
  
  // Get updated expense data for webhook
  const expenses = await ExpenseFirestoreService.getAllExpenses();
  const updatedExpense = expenses.find(e => e.id === expenseId);
  if (updatedExpense) {
    await triggerSync('expense', expenseId, 'updated', updatedExpense);
  }
};

export const approveExpense = async (expenseId: string): Promise<void> => {
  await ExpenseFirestoreService.approveExpense(expenseId);
  
  // Get updated expense data for webhook
  const expenses = await ExpenseFirestoreService.getAllExpenses();
  const approvedExpense = expenses.find(e => e.id === expenseId);
  if (approvedExpense) {
    await triggerSync('expense', expenseId, 'updated', approvedExpense);
  }
};

export const deleteExpense = async (expenseId: string): Promise<void> => {
  // Get expense data before deletion for webhook
  const expenses = await ExpenseFirestoreService.getAllExpenses();
  const expenseData = expenses.find(e => e.id === expenseId);
  
  await ExpenseFirestoreService.deleteExpense(expenseId);
  
  // Trigger webhook for N8N sync
  if (expenseData) {
    await triggerSync('expense', expenseId, 'deleted', expenseData);
  }
};

export const getExpensesByStatus = async (status: 'pending' | 'approved' | 'rejected'): Promise<SpendEvent[]> => {
  return await ExpenseFirestoreService.getExpensesByStatus(status);
};

export const rejectExpense = async (expenseId: string, reason: string): Promise<void> => {
  await ExpenseFirestoreService.rejectExpense(expenseId, reason);
  
  // Get updated expense data for webhook
  const expenses = await ExpenseFirestoreService.getAllExpenses();
  const rejectedExpense = expenses.find(e => e.id === expenseId);
  if (rejectedExpense) {
    await triggerSync('expense', expenseId, 'updated', rejectedExpense);
  }
};
