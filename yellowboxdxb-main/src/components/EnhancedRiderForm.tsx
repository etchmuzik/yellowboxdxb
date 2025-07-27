import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, CheckCircle, AlertCircle, User } from 'lucide-react';
import { simpleRiderService } from '@/services/simpleFirebaseService';

interface EnhancedRiderFormProps {
  onSuccess?: () => void;
}

export function EnhancedRiderForm({ onSuccess }: EnhancedRiderFormProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    nationality: 'UAE',
    status: 'Applied'
  });

  const nationalities = [
    'UAE', 'Saudi Arabia', 'Egypt', 'Pakistan', 'India', 'Bangladesh', 
    'Philippines', 'Jordan', 'Syria', 'Lebanon', 'Nepal', 'Sri Lanka', 'Other'
  ];

  const statuses = [
    'Applied', 'Documents Verified', 'Theory Test', 'Road Test', 
    'Medical', 'ID Issued', 'Active', 'Inactive'
  ];

  const clearFeedback = () => {
    setTimeout(() => setFeedback({ type: null, message: '' }), 3000);
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      nationality: 'UAE',
      status: 'Applied'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setFeedback({ type: 'error', message: 'Please fill in all required fields' });
      clearFeedback();
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFeedback({ type: 'error', message: 'Please enter a valid email address' });
      clearFeedback();
      return;
    }

    // Basic phone validation
    if (formData.phone.length < 8) {
      setFeedback({ type: 'error', message: 'Please enter a valid phone number' });
      clearFeedback();
      return;
    }

    setLoading(true);
    setFeedback({ type: null, message: '' });
    
    try {
      console.log('🚀 Creating new rider:', formData);
      
      const riderId = await simpleRiderService.create(formData);
      
      console.log('✅ Rider created successfully:', riderId);
      setFeedback({ 
        type: 'success', 
        message: `Rider "${formData.fullName}" added successfully!` 
      });
      
      resetForm();
      clearFeedback();
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('❌ Error creating rider:', error);
      setFeedback({ 
        type: 'error', 
        message: 'Failed to create rider. Please try again.' 
      });
      clearFeedback();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5 text-blue-600" />
          Quick Add Rider
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Feedback Message */}
          {feedback.type && (
            <div className={`flex items-center gap-2 p-3 rounded-lg ${
              feedback.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {feedback.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{feedback.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sm font-medium">
                Full Name *
              </Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter full name"
                disabled={loading}
                className="w-full"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="rider@example.com"
                disabled={loading}
                className="w-full"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number *
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+971 50 123 4567"
                disabled={loading}
                className="w-full"
              />
            </div>

            {/* Nationality */}
            <div className="space-y-2">
              <Label htmlFor="nationality" className="text-sm font-medium">
                Nationality
              </Label>
              <Select 
                value={formData.nationality} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, nationality: value }))}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent>
                  {nationalities.map((nationality) => (
                    <SelectItem key={nationality} value={nationality}>
                      {nationality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                Initial Status
              </Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full md:w-auto min-w-[140px] bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rider
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}