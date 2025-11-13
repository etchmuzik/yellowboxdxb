import { supabase } from '../../config/supabase';
import { BaseSupabaseService } from './baseService';
import { SpendEvent, SpendCategory } from '../../types';

// Define the database structure
interface ExpenseDB {
  id: string;
  rider_id: string;
  category: string;
  amount_aed: number;
  date: string;
  description?: string;
  receipt_url?: string;
  status: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
  created_at?: string;
  updated_at?: string;
}

export class ExpenseSupabaseService extends BaseSupabaseService<ExpenseDB> {
  constructor() {
    super('expenses');
  }

  /**
   * Get all expenses
   */
  static async getAllExpenses(): Promise<SpendEvent[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.convertFromDatabase);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      throw error;
    }
  }

  /**
   * Get expenses by rider
   */
  static async getExpensesByRider(riderId: string): Promise<SpendEvent[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('rider_id', riderId)
        .order('date', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.convertFromDatabase);
    } catch (error) {
      console.error("Error fetching expenses by rider:", error);
      throw error;
    }
  }

  /**
   * Get expenses by category
   */
  static async getExpensesByCategory(category: SpendCategory): Promise<SpendEvent[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('category', category)
        .order('date', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.convertFromDatabase);
    } catch (error) {
      console.error("Error fetching expenses by category:", error);
      throw error;
    }
  }

  /**
   * Get expenses by status
   */
  static async getExpensesByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<SpendEvent[]> {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('status', status)
        .order('date', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.convertFromDatabase);
    } catch (error) {
      console.error("Error getting expenses by status:", error);
      throw error;
    }
  }

  /**
   * Create a new expense
   */
  static async createExpense(expenseData: Omit<SpendEvent, 'id'>): Promise<string> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User must be authenticated to create expenses");
      }

      // Convert to database format
      const dbData = {
        rider_id: expenseData.riderId,
        category: expenseData.category,
        amount_aed: expenseData.amountAed,
        date: expenseData.date,
        description: expenseData.description,
        receipt_url: expenseData.receiptUrl,
        status: 'pending',
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('expenses')
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;

      // Log activity
      try {
        await supabase
          .from('activity_logs')
          .insert([{
            user_id: user.id,
            action: 'create_expense',
            entity_type: 'expense',
            entity_id: data.id,
            details: {
              amount: expenseData.amountAed,
              riderId: expenseData.riderId
            },
            timestamp: new Date().toISOString()
          }]);
      } catch (logError) {
        console.error("Error logging activity:", logError);
      }

      // Send notification to Finance team
      try {
        await this.sendExpenseNotification(
          data.id,
          expenseData.riderId,
          expenseData.amountAed,
          'submitted'
        );
      } catch (notifError) {
        console.error("Error sending notification:", notifError);
      }

      return data.id;
    } catch (error) {
      console.error("Error creating expense:", error);
      throw error;
    }
  }

  /**
   * Update an expense
   */
  static async updateExpense(expenseId: string, updates: Partial<SpendEvent>): Promise<void> {
    try {
      // Convert updates to database format
      const dbUpdates: Partial<ExpenseDB> = {
        updated_at: new Date().toISOString()
      };

      if (updates.riderId !== undefined) dbUpdates.rider_id = updates.riderId;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.amountAed !== undefined) dbUpdates.amount_aed = updates.amountAed;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.receiptUrl !== undefined) dbUpdates.receipt_url = updates.receiptUrl;

      const { error } = await supabase
        .from('expenses')
        .update(dbUpdates)
        .eq('id', expenseId);

      if (error) throw error;
    } catch (error) {
      console.error("Error updating expense:", error);
      throw error;
    }
  }

  /**
   * Approve an expense
   */
  static async approveExpense(expenseId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User must be authenticated to approve expenses");
      }

      // Get expense details for logging
      const { data: expense, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .single();

      if (fetchError) throw fetchError;
      if (!expense) throw new Error('Expense not found');

      // Update expense status
      const { error: updateError } = await supabase
        .from('expenses')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', expenseId);

      if (updateError) throw updateError;

      // Log activity
      try {
        await supabase
          .from('activity_logs')
          .insert([{
            user_id: user.id,
            action: 'approve_expense',
            entity_type: 'expense',
            entity_id: expenseId,
            details: {
              amount: expense.amount_aed,
              riderId: expense.rider_id
            },
            timestamp: new Date().toISOString()
          }]);
      } catch (logError) {
        console.error("Error logging activity:", logError);
      }

      // Send notification to rider
      try {
        await this.sendExpenseNotification(
          expenseId,
          expense.rider_id,
          expense.amount_aed,
          'approved'
        );
      } catch (notifError) {
        console.error("Error sending notification:", notifError);
      }
    } catch (error) {
      console.error("Error approving expense:", error);
      throw error;
    }
  }

  /**
   * Reject an expense
   */
  static async rejectExpense(expenseId: string, reason: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User must be authenticated to reject expenses");
      }

      // Get expense details for logging
      const { data: expense, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', expenseId)
        .single();

      if (fetchError) throw fetchError;
      if (!expense) throw new Error('Expense not found');

      // Update expense status
      const { error: updateError } = await supabase
        .from('expenses')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', expenseId);

      if (updateError) throw updateError;

      // Log activity
      try {
        await supabase
          .from('activity_logs')
          .insert([{
            user_id: user.id,
            action: 'reject_expense',
            entity_type: 'expense',
            entity_id: expenseId,
            details: {
              amount: expense.amount_aed,
              riderId: expense.rider_id,
              reason: reason
            },
            timestamp: new Date().toISOString()
          }]);
      } catch (logError) {
        console.error("Error logging activity:", logError);
      }

      // Send notification to rider
      try {
        await this.sendExpenseNotification(
          expenseId,
          expense.rider_id,
          expense.amount_aed,
          'rejected',
          reason
        );
      } catch (notifError) {
        console.error("Error sending notification:", notifError);
      }
    } catch (error) {
      console.error("Error rejecting expense:", error);
      throw error;
    }
  }

  /**
   * Delete an expense
   */
  static async deleteExpense(expenseId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  }

  /**
   * Convert database row to SpendEvent type
   */
  private static convertFromDatabase(dbExpense: any): SpendEvent {
    return {
      id: dbExpense.id,
      riderId: dbExpense.rider_id,
      category: dbExpense.category as SpendCategory,
      amountAed: dbExpense.amount_aed,
      date: dbExpense.date,
      description: dbExpense.description,
      receiptUrl: dbExpense.receipt_url
    };
  }

  /**
   * Send expense notification
   */
  private static async sendExpenseNotification(
    expenseId: string,
    riderId: string,
    amount: number,
    status: 'submitted' | 'approved' | 'rejected',
    reason?: string
  ): Promise<void> {
    try {
      const messages = {
        submitted: `New expense submitted: AED ${amount}`,
        approved: `Your expense of AED ${amount} has been approved`,
        rejected: `Your expense of AED ${amount} has been rejected${reason ? `: ${reason}` : ''}`
      };

      await supabase
        .from('notifications')
        .insert([{
          user_id: riderId,
          title: `Expense ${status}`,
          message: messages[status],
          type: 'expense',
          entity_id: expenseId,
          created_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error("Error sending expense notification:", error);
      // Don't throw - notification failures shouldn't block expense operations
    }
  }

  /**
   * Get expense statistics
   */
  static async getExpenseStats(riderId?: string): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalAmount: number;
  }> {
    try {
      let query = supabase.from('expenses').select('*');

      if (riderId) {
        query = query.eq('rider_id', riderId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const expenses = data || [];

      return {
        total: expenses.length,
        pending: expenses.filter(e => e.status === 'pending').length,
        approved: expenses.filter(e => e.status === 'approved').length,
        rejected: expenses.filter(e => e.status === 'rejected').length,
        totalAmount: expenses.reduce((sum, e) => sum + e.amount_aed, 0)
      };
    } catch (error) {
      console.error("Error getting expense stats:", error);
      throw error;
    }
  }
}
