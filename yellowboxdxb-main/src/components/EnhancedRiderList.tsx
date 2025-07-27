import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, RefreshCw, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import { simpleRiderService, SimpleRider } from '@/services/simpleFirebaseService';

interface EnhancedRiderListProps {
  refreshTrigger?: number;
}

export function EnhancedRiderList({ refreshTrigger }: EnhancedRiderListProps) {
  const [riders, setRiders] = useState<SimpleRider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const statusColors: Record<string, string> = {
    'Applied': 'bg-yellow-100 text-yellow-800',
    'Documents Verified': 'bg-blue-100 text-blue-800',
    'Theory Test': 'bg-purple-100 text-purple-800',
    'Road Test': 'bg-orange-100 text-orange-800',
    'Medical': 'bg-pink-100 text-pink-800',
    'ID Issued': 'bg-indigo-100 text-indigo-800',
    'Active': 'bg-green-100 text-green-800',
    'Inactive': 'bg-gray-100 text-gray-800'
  };

  const loadRiders = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      console.log('🔄 Loading riders...');
      const allRiders = await simpleRiderService.getAll();
      
      // Sort riders by creation date (newest first)
      const sortedRiders = allRiders.sort((a, b) => {
        const dateA = a.createdAt?.getTime() || 0;
        const dateB = b.createdAt?.getTime() || 0;
        return dateB - dateA;
      });
      
      setRiders(sortedRiders);
      console.log('✅ Loaded riders:', sortedRiders.length);
    } catch (error) {
      console.error('❌ Error loading riders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadRiders(true);
  };

  useEffect(() => {
    loadRiders();
  }, []);

  useEffect(() => {
    if (refreshTrigger) {
      loadRiders(true);
    }
  }, [refreshTrigger]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading riders...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-blue-600" />
            All Riders ({riders.length})
          </CardTitle>
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="h-8"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {riders.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No riders found</p>
            <p className="text-sm text-gray-400">Add your first rider using the form above</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {riders.map((rider) => (
              <div 
                key={rider.id} 
                className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {rider.fullName}
                    </h4>
                    <Badge 
                      className={`text-xs ${statusColors[rider.status] || 'bg-gray-100 text-gray-800'}`}
                      variant="secondary"
                    >
                      {rider.status}
                    </Badge>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {rider.createdAt?.toLocaleDateString('en-AE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) || 'Unknown'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span className="truncate">{rider.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4 text-green-500" />
                    <span>{rider.phone}</span>
                  </div>
                  {rider.nationality && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4 text-orange-500" />
                      <span>{rider.nationality}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}