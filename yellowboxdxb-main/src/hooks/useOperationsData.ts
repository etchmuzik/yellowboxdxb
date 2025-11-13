import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { Rider, Bike } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  userId?: string;
  riderId?: string;
}

interface OperationsData {
  riders: Rider[];
  bikes: Bike[];
  activities: Activity[];
  loading: boolean;
}

export function useOperationsData(): OperationsData {
  const [loading, setLoading] = useState(true);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    let ridersChannel: RealtimeChannel;
    let bikesChannel: RealtimeChannel;
    let activitiesChannel: RealtimeChannel;

    // Fetch riders from Supabase
    const fetchRiders = async () => {
      try {
        const { data, error } = await supabase
          .from('riders')
          .select('*');

        if (error) {
          console.error('Error fetching riders:', error);
          return;
        }

        // Convert snake_case to camelCase for existing types
        const ridersData: Rider[] = (data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          phone: item.phone,
          applicationStage: item.application_stage || item.applicationStage,
          status: item.status,
          documentsVerified: item.documents_verified || item.documentsVerified,
          bikesAssigned: item.bikes_assigned || item.bikesAssigned,
          createdAt: item.created_at || item.createdAt,
          // Include all other properties
          ...item
        }));

        setRiders(ridersData);
      } catch (error) {
        console.error('Error in fetchRiders:', error);
      }
    };

    // Fetch bikes from Supabase
    const fetchBikes = async () => {
      try {
        const { data, error } = await supabase
          .from('bikes')
          .select('*');

        if (error) {
          console.error('Error fetching bikes:', error);
          return;
        }

        // Convert snake_case to camelCase for existing types
        const bikesData: Bike[] = (data || []).map((item: any) => ({
          id: item.id,
          registration: item.registration,
          model: item.model,
          status: item.status,
          assignedTo: item.assigned_to || item.assignedTo,
          gpsTrackerId: item.gps_tracker_id || item.gpsTrackerId,
          // Include all other properties
          ...item
        }));

        setBikes(bikesData);
      } catch (error) {
        console.error('Error in fetchBikes:', error);
      }
    };

    // Fetch activities from Supabase
    const fetchActivities = async () => {
      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Error fetching activities:', error);
          return;
        }

        const activitiesData: Activity[] = (data || []).map((item: any) => ({
          id: item.id,
          type: item.type || item.action_type,
          description: item.description || item.action,
          timestamp: item.timestamp,
          userId: item.user_id || item.userId,
          riderId: item.rider_id || item.riderId
        }));

        setActivities(activitiesData);
      } catch (error) {
        console.error('Error in fetchActivities:', error);
      }
    };

    // Initial fetch
    Promise.all([fetchRiders(), fetchBikes(), fetchActivities()])
      .finally(() => setLoading(false));

    // Set up real-time subscriptions
    ridersChannel = supabase
      .channel('riders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'riders' },
        () => {
          console.log('Riders changed');
          fetchRiders();
        }
      )
      .subscribe();

    bikesChannel = supabase
      .channel('bikes-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bikes' },
        () => {
          console.log('Bikes changed');
          fetchBikes();
        }
      )
      .subscribe();

    activitiesChannel = supabase
      .channel('activities-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        () => {
          console.log('New activity logged');
          fetchActivities();
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      console.log('Unsubscribing from operations data');
      supabase.removeChannel(ridersChannel);
      supabase.removeChannel(bikesChannel);
      supabase.removeChannel(activitiesChannel);
    };
  }, []);

  return { riders, bikes, activities, loading };
}

export type { Activity };