import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { simpleExpenseService, simpleRiderService, SimpleRider } from '@/services/simpleFirebaseService';

interface SimpleExpenseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SimpleExpenseForm({ onSuccess, onCancel }: SimpleExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [riders, setRiders] = useState<SimpleRider[]>([]);
  const [formData, setFormData] = useState({
    riderId: '',
    riderName: '',
    amount: '',
    category: '',
    description: ''
  });

  // Load riders on mount
  useEffect(() => {
    const loadRiders = async () => {
      try {
        const allRiders = await simpleRiderService.getAll();
        setRiders(allRiders);
        console.log('✅ Loaded riders for expense form:', allRiders.length);
      } catch (error) {
        console.error('❌ Error loading riders:', error);
        alert('Failed to load riders');
      }
    };
    loadRiders();
  }, []);

  const handleRiderSelect = (riderId: string) => {
    const selectedRider = riders.find(r => r.id === riderId);
    setFormData(prev => ({
      ...prev,
      riderId,
      riderName: selectedRider?.fullName || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.riderId || !formData.amount || !formData.category || !formData.description) {
      alert('Please fill all fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🚀 Submitting expense:', formData);
      
      const expenseId = await simpleExpenseService.add({
        riderId: formData.riderId,
        riderName: formData.riderName,
        amountAed: amount,
        category: formData.category,
        description: formData.description,
        date: new Date(),
        status: 'Pending'
      });
      
      console.log('✅ Success! Expense created:', expenseId);
      
      // Reset form
      setFormData({
        riderId: '',
        riderName: '',
        amount: '',
        category: '',
        description: ''
      });
      
      console.log('🔄 Calling onSuccess callback...');
      if (onSuccess) {
        onSuccess();
        console.log('✅ onSuccess callback called');
      } else {
        console.log('⚠️ No onSuccess callback provided');
      }
    } catch (error) {
      console.error('❌ Error creating expense:', error);
      alert('Failed to create expense: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Fuel',
    'Maintenance', 
    'Insurance',
    'Equipment',
    'Medical',
    'Training',
    'Other'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Add New Expense</h3>
      
      <div>
        <Label htmlFor="rider">Rider</Label>
        <Select value={formData.riderId} onValueChange={handleRiderSelect} disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder="Select a rider" />
          </SelectTrigger>
          <SelectContent>
            {riders.map((rider) => (
              <SelectItem key={rider.id} value={rider.id!}>
                {rider.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="amount">Amount (AED)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={formData.amount}
          onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
          placeholder="0.00"
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))} disabled={loading}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Enter expense description"
          disabled={loading}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Expense'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}