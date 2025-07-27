import React, { useState, useEffect } from 'react';
import { simpleExpenseService, SimpleExpense } from '@/services/simpleFirebaseService';

export function SimpleExpenseList() {
  const [expenses, setExpenses] = useState<SimpleExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const allExpenses = await simpleExpenseService.getAll();
      setExpenses(allExpenses);
      console.log('✅ Loaded expenses:', allExpenses);
    } catch (error) {
      console.error('❌ Error loading expenses:', error);
      alert('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  if (loading) {
    return <div className="p-4">Loading expenses...</div>;
  }

  if (expenses.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">No expenses found</p>
        <p className="text-sm text-gray-400">Add an expense to get started</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Expenses ({expenses.length})</h3>
      
      <div className="space-y-2">
        {expenses.map((expense) => (
          <div key={expense.id} className="p-3 border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{expense.riderName}</h4>
                <p className="text-sm text-gray-600">{expense.description}</p>
                <p className="text-sm text-gray-500">{expense.category}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-lg">{expense.amount.toFixed(2)} AED</p>
                <span className={`inline-block px-2 py-1 text-xs rounded ${
                  expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                  expense.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {expense.status}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {expense.date?.toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={loadExpenses}
        className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
      >
        Refresh
      </button>
    </div>
  );
}