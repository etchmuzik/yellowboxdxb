import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { simpleRiderService } from '@/services/simpleFirebaseService';

interface SimpleRiderFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SimpleRiderForm({ onSuccess, onCancel }: SimpleRiderFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.phone) {
      alert('Please fill all fields');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🚀 Submitting rider:', formData);
      
      const riderId = await simpleRiderService.create(formData);
      
      console.log('✅ Success! Rider created:', riderId);
      alert(`Rider "${formData.fullName}" created successfully!`);
      
      // Reset form
      setFormData({ fullName: '', email: '', phone: '' });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('❌ Error creating rider:', error);
      alert('Failed to create rider: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Add New Rider</h3>
      
      <div>
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          value={formData.fullName}
          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
          placeholder="Enter full name"
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          placeholder="Enter email"
          disabled={loading}
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          placeholder="Enter phone number"
          disabled={loading}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Rider'}
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