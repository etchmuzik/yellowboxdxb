import React, { useState } from 'react';
import { EnhancedRiderForm } from '@/components/EnhancedRiderForm';
import { EnhancedRiderList } from '@/components/EnhancedRiderList';
import { SimpleExpenseForm } from '@/components/SimpleExpenseForm';
import { SimpleExpenseList } from '@/components/SimpleExpenseList';

export function SimpleTest() {
  const [activeTab, setActiveTab] = useState('riders');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAddExpense, setShowAddExpense] = useState(false);

  const handleRiderSuccess = () => {
    // Trigger refresh of the rider list
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Yellow Box Fleet Management</h1>
        <p className="text-gray-600">Streamlined rider and expense management system</p>
      </div>
      
      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-8 bg-white p-1 rounded-lg shadow-sm w-fit">
        <button
          onClick={() => setActiveTab('riders')}
          className={`px-6 py-2 rounded-md font-medium transition-all ${
            activeTab === 'riders'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          🏍️ Riders
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-6 py-2 rounded-md font-medium transition-all ${
            activeTab === 'expenses'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          💰 Expenses
        </button>
      </div>

      {/* Riders Tab */}
      {activeTab === 'riders' && (
        <div className="space-y-6">
          <EnhancedRiderForm onSuccess={handleRiderSuccess} />
          <EnhancedRiderList refreshTrigger={refreshTrigger} />
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Manage Expenses</h2>
              <button
                onClick={() => setShowAddExpense(!showAddExpense)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                {showAddExpense ? 'Hide Form' : 'Add Expense'}
              </button>
            </div>
            
            {showAddExpense && (
              <SimpleExpenseForm
                onSuccess={() => {
                  setShowAddExpense(false);
                  // List will automatically refresh when we switch tabs or refresh
                }}
                onCancel={() => setShowAddExpense(false)}
              />
            )}
          </div>
          
          <div>
            <SimpleExpenseList />
          </div>
        </div>
      )}

      {/* Enhanced Instructions */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
        <h3 className="font-semibold text-blue-900 text-lg mb-3">💡 How to Use This System:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">🏍️ Riders Management:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Form is always visible and ready to use</li>
              <li>Required fields: Name, Email, Phone</li>
              <li>Optional: Nationality and Status</li>
              <li>Auto-refresh after adding riders</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">💰 Expenses Management:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Click "Add Expense" to show form</li>
              <li>Select rider from dropdown</li>
              <li>All data saves to Firebase instantly</li>
              <li>Real-time status updates</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-3 bg-white rounded border border-blue-200">
          <p className="text-xs text-blue-600">
            <strong>✅ Production Ready:</strong> This system is now deployed and working at
            <a href="https://yellowboxdxb.web.app/simple-test" target="_blank" rel="noopener noreferrer" className="underline ml-1">
              https://yellowboxdxb.web.app/simple-test
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SimpleTest;