import React, { useState, useEffect } from 'react';
import { simpleRiderService, SimpleRider } from '@/services/simpleFirebaseService';

export function SimpleRiderList() {
  const [riders, setRiders] = useState<SimpleRider[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRiders = async () => {
    setLoading(true);
    try {
      const allRiders = await simpleRiderService.getAll();
      setRiders(allRiders);
      console.log('✅ Loaded riders:', allRiders);
    } catch (error) {
      console.error('❌ Error loading riders:', error);
      alert('Failed to load riders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiders();
  }, []);

  if (loading) {
    return <div className="p-4">Loading riders...</div>;
  }

  if (riders.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">No riders found</p>
        <p className="text-sm text-gray-400">Add a rider to get started</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Riders ({riders.length})</h3>
      
      <div className="space-y-2">
        {riders.map((rider) => (
          <div key={rider.id} className="p-3 border rounded-lg bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">{rider.fullName}</h4>
                <p className="text-sm text-gray-600">{rider.email}</p>
                <p className="text-sm text-gray-600">{rider.phone}</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  {rider.status}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {rider.createdAt?.toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={loadRiders}
        className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
      >
        Refresh
      </button>
    </div>
  );
}