
import { where, orderBy } from "firebase/firestore";
import { FirestoreService } from "./firestoreService";
import { COLLECTIONS, FirestoreExpense } from "@/config/firestore-schema";
import { SpendEvent, SpendCategory } from "@/types";
import { auth } from "@/config/firebase";
import { logExpenseActivity } from "./activityService";
import { NotificationService } from "./notificationService";

export class ExpenseFirestoreService {
  static async getAllExpenses(): Promise<SpendEvent[]> {
    try {
      const firestoreExpenses = await FirestoreService.getCollection<FirestoreExpense>(COLLECTIONS.EXPENSES);
      return firestoreExpenses.map(this.convertFromFirestore);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      throw error;
    }
  }

  static async getExpensesByRider(riderId: string): Promise<SpendEvent[]> {
    try {
      const firestoreExpenses = await FirestoreService.queryCollection<FirestoreExpense>(
        COLLECTIONS.EXPENSES,
        where("riderId", "==", riderId),
        orderBy("date", "desc")
      );
      return firestoreExpenses.map(this.convertFromFirestore);
    } catch (error) {
      console.error("Error fetching expenses by rider:", error);
      throw error;
    }
  }

  static async getExpensesByCategory(category: SpendCategory): Promise<SpendEvent[]> {
    try {
      const firestoreExpenses = await FirestoreService.queryCollection<FirestoreExpense>(
        COLLECTIONS.EXPENSES,
        where("category", "==", category),
        orderBy("date", "desc")
      );
      return firestoreExpenses.map(this.convertFromFirestore);
    } catch (error) {
      console.error("Error fetching expenses by category:", error);
      throw error;
    }
  }

  static async createExpense(expenseData: Omit<SpendEvent, 'id'>): Promise<string> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User must be authenticated to create expenses");
      }

      const firestoreData: Omit<FirestoreExpense, 'id'> = {
        ...expenseData,
        status: 'Pending',
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const expenseId = await FirestoreService.addDocument<FirestoreExpense>(COLLECTIONS.EXPENSES, firestoreData);
      
      // Log activity
      await logExpenseActivity('create', expenseId, expenseData.amountAed, expenseData.riderId);
      
      // Send notification to Finance team
      await NotificationService.notifyExpenseSubmitted(expenseId, expenseData.riderId, expenseData.amountAed);
      
      return expenseId;
    } catch (error) {
      console.error("Error creating expense:", error);
      throw error;
    }
  }

  static async updateExpense(expenseId: string, updates: Partial<SpendEvent>): Promise<void> {
    try {
      const firestoreUpdates = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await FirestoreService.updateDocument(COLLECTIONS.EXPENSES, expenseId, firestoreUpdates);
    } catch (error) {
      console.error("Error updating expense:", error);
      throw error;
    }
  }

  static async approveExpense(expenseId: string): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User must be authenticated to approve expenses");
      }

      // Get expense details for logging
      const expense = await FirestoreService.getDocument<FirestoreExpense>(COLLECTIONS.EXPENSES, expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }

      await FirestoreService.updateDocument(COLLECTIONS.EXPENSES, expenseId, {
        status: 'Approved',
        approvedBy: currentUser.uid,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Log activity
      await logExpenseActivity('approve', expenseId, expense.amountAed, expense.riderId);
      
      // Send notification to rider
      await NotificationService.notifyExpenseApproved(expenseId, expense.riderId, expense.amountAed);
    } catch (error) {
      console.error("Error approving expense:", error);
      throw error;
    }
  }

  static async deleteExpense(expenseId: string): Promise<void> {
    try {
      await FirestoreService.deleteDocument(COLLECTIONS.EXPENSES, expenseId);
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  }

  static async getExpensesByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<SpendEvent[]> {
    try {
      const expenses = await FirestoreService.getCollection<FirestoreExpense>(
        COLLECTIONS.EXPENSES,
        [{ field: 'status', operator: '==', value: status }],
        { field: 'date', direction: 'desc' }
      );
      return expenses.map(expense => this.convertFromFirestore(expense));
    } catch (error) {
      console.error("Error getting expenses by status:", error);
      throw error;
    }
  }

  static async rejectExpense(expenseId: string, reason: string): Promise<void> {
    try {
      // Get expense details for logging
      const expense = await FirestoreService.getDocument<FirestoreExpense>(COLLECTIONS.EXPENSES, expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }

      await FirestoreService.updateDocument(COLLECTIONS.EXPENSES, expenseId, {
        status: 'rejected',
        rejectionReason: reason,
        rejectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Log activity
      await logExpenseActivity('reject', expenseId, expense.amountAed, expense.riderId, reason);
      
      // Send notification to rider
      await NotificationService.notifyExpenseRejected(expenseId, expense.riderId, expense.amountAed, reason);
    } catch (error) {
      console.error("Error rejecting expense:", error);
      throw error;
    }
  }

  // Convert Firestore document to SpendEvent type
  private static convertFromFirestore(firestoreExpense: FirestoreExpense): SpendEvent {
    return {
      id: firestoreExpense.id,
      riderId: firestoreExpense.riderId,
      category: firestoreExpense.category as SpendCategory,
      amountAed: firestoreExpense.amountAed,
      date: firestoreExpense.date,
      description: firestoreExpense.description,
      receiptUrl: firestoreExpense.receiptUrl
    };
  }
}
