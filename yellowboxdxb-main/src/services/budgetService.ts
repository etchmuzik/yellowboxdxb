// Adapter file: Re-exports Supabase budgetService
// All existing component imports will now use Supabase

export {
  getBudgets,
  getAllBudgets,
  getCurrentBudget,
  getBudgetByMonth,
  createOrUpdateBudget,
  updateBudgetSpent,
  incrementBudgetSpent,
  decrementBudgetSpent
} from './supabase/budgetSupabaseService';
