import { supabase } from '../../config/supabase';
import { Budget } from '../../types';

const TABLE_NAME = "budgets";

export const getBudgets = async (): Promise<Budget[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('month', { ascending: false });

  if (error) {
    console.error("Error fetching budgets:", error);
    throw error;
  }

  return data || [];
};

export const getAllBudgets = getBudgets; // Alias for consistency

export const getCurrentBudget = async (): Promise<Budget | null> => {
  const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('month', currentMonth)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error("Error fetching current budget:", error);
    throw error;
  }

  return data;
};

export const getBudgetByMonth = async (month: string): Promise<Budget | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('month', month)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error("Error fetching budget by month:", error);
    throw error;
  }

  return data;
};

export const createOrUpdateBudget = async (month: string, allocatedAed: number): Promise<Budget> => {
  const existingBudget = await getBudgetByMonth(month);

  if (existingBudget) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ allocatedAed })
      .eq('id', existingBudget.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating budget:", error);
      throw error;
    }

    return data;
  } else {
    const newBudget: Omit<Budget, "id"> = {
      month,
      allocatedAed,
      spentAed: 0
    };

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([newBudget])
      .select()
      .single();

    if (error) {
      console.error("Error creating budget:", error);
      throw error;
    }

    return data;
  }
};

export const updateBudgetSpent = async (month: string, spentAed: number): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .update({ spentAed })
    .eq('month', month);

  if (error) {
    console.error("Error updating budget spent:", error);
    throw error;
  }
};

export const incrementBudgetSpent = async (month: string, amount: number): Promise<void> => {
  const budget = await getBudgetByMonth(month);

  if (budget) {
    const newSpent = budget.spentAed + amount;
    await updateBudgetSpent(month, newSpent);
  }
};

export const decrementBudgetSpent = async (month: string, amount: number): Promise<void> => {
  const budget = await getBudgetByMonth(month);

  if (budget) {
    const newSpent = Math.max(0, budget.spentAed - amount);
    await updateBudgetSpent(month, newSpent);
  }
};
