import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { createTestUsers } from '@/scripts/createTestUsers';
import { seedDatabase } from '@/scripts/seedData';
import { auth } from '@/config/firebase';

export function Setup() {
  const [status, setStatus] = useState<{
    users: 'idle' | 'loading' | 'success' | 'error';
    data: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({
    users: 'idle',
    data: 'idle',
    message: ''
  });

  const handleCreateUsers = async () => {
    setStatus(prev => ({ ...prev, users: 'loading', message: 'Creating test users...' }));
    try {
      await createTestUsers();
      setStatus(prev => ({ ...prev, users: 'success', message: 'Test users created successfully!' }));
    } catch (error) {
      console.error('Error creating users:', error);
      setStatus(prev => ({ ...prev, users: 'error', message: 'Failed to create test users' }));
    }
  };

  const handleSeedData = async () => {
    setStatus(prev => ({ ...prev, data: 'loading', message: 'Seeding database...' }));
    try {
      await seedDatabase();
      setStatus(prev => ({ ...prev, data: 'success', message: 'Database seeded successfully!' }));
    } catch (error) {
      console.error('Error seeding data:', error);
      setStatus(prev => ({ ...prev, data: 'error', message: 'Failed to seed database' }));
    }
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'loading') return <Loader2 className="h-5 w-5 animate-spin" />;
    if (status === 'success') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (status === 'error') return <XCircle className="h-5 w-5 text-red-500" />;
    return null;
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Yellow Box Setup</h1>
      
      <Alert className="mb-6">
        <AlertDescription>
          This page helps you set up your Yellow Box application with test users and sample data.
          Make sure you've configured Firebase authentication and Firestore in your Firebase console.
        </AlertDescription>
      </Alert>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Firebase Configuration</CardTitle>
            <CardDescription>
              Ensure these are enabled in your Firebase Console:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Email/Password Authentication is enabled</li>
              <li>Firestore Database is created (in production or test mode)</li>
              <li>Firebase Storage is enabled (for document uploads)</li>
              <li>Security rules are deployed (use the firestore.rules file)</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Create Test Users</CardTitle>
            <CardDescription>
              This will create test users for all roles (Admin, Operations, Finance, Rider)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleCreateUsers}
              disabled={status.users === 'loading'}
              className="w-full"
            >
              {status.users === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Users...
                </>
              ) : (
                <>
                  Create Test Users
                  <StatusIcon status={status.users} />
                </>
              )}
            </Button>
            
            {status.users === 'success' && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="font-semibold mb-2">Test Users Created:</p>
                <ul className="text-sm space-y-1">
                  <li>Admin: admin@yellowbox.ae / Admin123!</li>
                  <li>Operations: operations@yellowbox.ae / Operations123!</li>
                  <li>Finance: finance@yellowbox.ae / Finance123!</li>
                  <li>Rider: rider@yellowbox.ae / Rider123!</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 3: Seed Sample Data</CardTitle>
            <CardDescription>
              This will add sample riders and expenses to your database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleSeedData}
              disabled={status.data === 'loading'}
              className="w-full"
            >
              {status.data === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Seeding Database...
                </>
              ) : (
                <>
                  Seed Sample Data
                  <StatusIcon status={status.data} />
                </>
              )}
            </Button>
            
            {status.data === 'success' && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="font-semibold mb-2">Sample Data Added:</p>
                <ul className="text-sm space-y-1">
                  <li>3 sample riders with different stages</li>
                  <li>4 sample expenses across categories</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 4: Test Your Setup</CardTitle>
            <CardDescription>
              Once users and data are created, you can test the application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>1. Go to <a href="/login" className="text-blue-500 underline">Login Page</a></p>
              <p>2. Try logging in with the Finance user: finance@yellowbox.ae</p>
              <p>3. Navigate to Expenses and check if riders appear in the dropdown</p>
              <p>4. Check the "By Rider" tab to see riders with their expenses</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {status.message && (
        <Alert className={`mt-6 ${status.users === 'error' || status.data === 'error' ? 'border-red-500' : ''}`}>
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}