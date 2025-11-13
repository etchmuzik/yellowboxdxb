/**
 * Simple Firebase Service - Adapter for backward compatibility
 * Now uses Supabase services under the hood
 *
 * This adapter maintains the same API so legacy components don't need changes.
 */

import { RiderSupabaseService } from './supabase/riderSupabaseService';
import { ExpenseSupabaseService } from './supabase/expenseSupabaseService';

// Create instances
const riderService = new RiderSupabaseService();
const expenseService = new ExpenseSupabaseService();

export interface SimpleRider {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  nationality?: string;
  status?: string;
  createdAt?: Date;
}

class SimpleRiderService {
  async getAll(): Promise<SimpleRider[]> {
    try {
      const riders = await riderService.getAll();
      return riders.map(rider => ({
        id: rider.id || '',
        fullName: rider.name || rider.fullName || '',
        phone: rider.phone || '',
        email: rider.email || '',
        nationality: rider.nationality,
        status: rider.applicationStage || rider.status,
        createdAt: rider.createdAt ? new Date(rider.createdAt) : new Date()
      }));
    } catch (error) {
      console.error('Error fetching riders:', error);
      return [];
    }
  }

  async getById(id: string): Promise<SimpleRider | null> {
    try {
      const rider = await riderService.getById(id);
      if (!rider) return null;

      return {
        id: rider.id || '',
        fullName: rider.name || rider.fullName || '',
        phone: rider.phone || '',
        email: rider.email || '',
        nationality: rider.nationality,
        status: rider.applicationStage || rider.status,
        createdAt: rider.createdAt ? new Date(rider.createdAt) : new Date()
      };
    } catch (error) {
      console.error('Error fetching rider:', error);
      return null;
    }
  }

  async create(rider: Omit<SimpleRider, 'id'>): Promise<string> {
    try {
      return await riderService.create({
        name: rider.fullName,
        fullName: rider.fullName,
        phone: rider.phone,
        email: rider.email,
        nationality: rider.nationality,
        applicationStage: rider.status || 'Applied',
        status: rider.status || 'Applied'
      } as any);
    } catch (error) {
      console.error('Error creating rider:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<SimpleRider>): Promise<void> {
    try {
      const updateData: any = {};
      if (updates.fullName) {
        updateData.name = updates.fullName;
        updateData.fullName = updates.fullName;
      }
      if (updates.phone) updateData.phone = updates.phone;
      if (updates.email) updateData.email = updates.email;
      if (updates.nationality) updateData.nationality = updates.nationality;
      if (updates.status) {
        updateData.applicationStage = updates.status;
        updateData.status = updates.status;
      }

      await riderService.update(id, updateData);
    } catch (error) {
      console.error('Error updating rider:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await riderService.delete(id);
    } catch (error) {
      console.error('Error deleting rider:', error);
      throw error;
    }
  }
}

export interface SimpleExpense {
  id: string;
  riderId: string;
  category: string;
  amount: number;
  description: string;
  status?: string;
  createdAt?: Date;
}

class SimpleExpenseService {
  async getAll(): Promise<SimpleExpense[]> {
    try {
      const expenses = await expenseService.getAll();
      return expenses.map(expense => ({
        id: expense.id || '',
        riderId: expense.riderId || expense.rider_id || '',
        category: expense.category || '',
        amount: expense.amount || 0,
        description: expense.description || '',
        status: expense.status,
        createdAt: expense.createdAt ? new Date(expense.createdAt) : new Date()
      }));
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
  }

  async getById(id: string): Promise<SimpleExpense | null> {
    try {
      const expense = await expenseService.getById(id);
      if (!expense) return null;

      return {
        id: expense.id || '',
        riderId: expense.riderId || expense.rider_id || '',
        category: expense.category || '',
        amount: expense.amount || 0,
        description: expense.description || '',
        status: expense.status,
        createdAt: expense.createdAt ? new Date(expense.createdAt) : new Date()
      };
    } catch (error) {
      console.error('Error fetching expense:', error);
      return null;
    }
  }

  async create(expense: Omit<SimpleExpense, 'id'>): Promise<string> {
    try {
      return await expenseService.create({
        riderId: expense.riderId,
        rider_id: expense.riderId,
        category: expense.category,
        amount: expense.amount,
        description: expense.description,
        status: expense.status || 'Pending'
      } as any);
    } catch (error) {
      console.error('Error creating expense:', error);
      throw error;
    }
  }

  async update(id: string, updates: Partial<SimpleExpense>): Promise<void> {
    try {
      const updateData: any = {};
      if (updates.riderId) {
        updateData.riderId = updates.riderId;
        updateData.rider_id = updates.riderId;
      }
      if (updates.category) updateData.category = updates.category;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.description) updateData.description = updates.description;
      if (updates.status) updateData.status = updates.status;

      await expenseService.update(id, updateData);
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await expenseService.delete(id);
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }
}

export const simpleRiderService = new SimpleRiderService();
export const simpleExpenseService = new SimpleExpenseService();
