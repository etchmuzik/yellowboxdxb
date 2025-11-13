import { supabase } from '@/config/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface BikeLocation {
  riderId: string;
  riderName: string;
  bikeId: string;
  bikeModel: string;
  bikeType?: string;
  bikeRegistration?: string;
  gpsTrackerId?: string;
  latitude: number;
  longitude: number;
  status: 'Active' | 'Idle' | 'Offline';
  speed: number;
  lastUpdate: Date;
  district?: string;
  battery?: number;
}

export class BikeTrackerSupabaseService {
  // Subscribe to real-time bike locations using Supabase Realtime
  static subscribeToLocations(callback: (locations: BikeLocation[]) => void): () => void {
    let channel: RealtimeChannel;

    // Initial fetch of active locations
    const fetchLocations = async () => {
      try {
        const { data, error } = await supabase
          .from('bike_locations')
          .select('*')
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching bike locations:', error);
          return;
        }

        const locations: BikeLocation[] = (data || []).map((item: any) => ({
          riderId: item.id || item.rider_id,
          riderName: item.rider_name || 'Unknown Rider',
          bikeId: item.bike_id || '',
          bikeModel: item.bike_model || 'Unknown Model',
          bikeType: item.bike_type,
          bikeRegistration: item.bike_registration,
          gpsTrackerId: item.gps_tracker_id,
          latitude: item.latitude || 25.2048, // Default to Dubai center
          longitude: item.longitude || 55.2708,
          status: item.status || 'Offline',
          speed: item.speed || 0,
          lastUpdate: item.last_update ? new Date(item.last_update) : new Date(),
          district: item.district || this.getDistrictFromCoordinates(item.latitude, item.longitude),
          battery: item.battery || 100
        }));

        callback(locations);
      } catch (error) {
        console.error('Error in fetchLocations:', error);
      }
    };

    // Fetch initial data
    fetchLocations();

    // Set up real-time subscription
    channel = supabase
      .channel('bike-locations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'bike_locations',
          filter: 'is_active=eq.true'
        },
        (payload) => {
          console.log('Bike location change detected:', payload.eventType);
          // Re-fetch all locations on any change for simplicity
          // For optimization, could handle INSERT/UPDATE/DELETE individually
          fetchLocations();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to bike locations');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to bike locations');
        }
      });

    // Return cleanup function
    return () => {
      console.log('Unsubscribing from bike locations');
      supabase.removeChannel(channel);
    };
  }

  // Update rider location
  static async updateLocation(riderId: string, locationData: {
    latitude: number;
    longitude: number;
    speed?: number;
    status?: 'Active' | 'Idle' | 'Offline';
    battery?: number;
  }) {
    try {
      const district = this.getDistrictFromCoordinates(locationData.latitude, locationData.longitude);

      const { error } = await supabase
        .from('bike_locations')
        .upsert({
          id: riderId,
          rider_id: riderId,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          speed: locationData.speed || 0,
          status: locationData.status || 'Active',
          battery: locationData.battery || 100,
          district,
          last_update: new Date().toISOString(),
          is_active: true
        });

      if (error) {
        console.error('Error updating location:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateLocation:', error);
      throw error;
    }
  }

  // Initialize location document for a new rider
  static async initializeRiderLocation(riderId: string, riderData: {
    riderName: string;
    bikeId: string;
    bikeModel: string;
    bikeType?: string;
    bikeRegistration?: string;
    gpsTrackerId?: string;
  }) {
    try {
      const { error } = await supabase
        .from('bike_locations')
        .upsert({
          id: riderId,
          rider_id: riderId,
          rider_name: riderData.riderName,
          bike_id: riderData.bikeId,
          bike_model: riderData.bikeModel,
          bike_type: riderData.bikeType,
          bike_registration: riderData.bikeRegistration,
          gps_tracker_id: riderData.gpsTrackerId,
          latitude: 25.2048, // Dubai center
          longitude: 55.2708,
          status: 'Offline',
          speed: 0,
          battery: 100,
          district: 'Downtown Dubai',
          last_update: new Date().toISOString(),
          is_active: true
        });

      if (error) {
        console.error('Error initializing rider location:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in initializeRiderLocation:', error);
      throw error;
    }
  }

  // Get district name from coordinates
  private static getDistrictFromCoordinates(lat: number, lng: number): string {
    const districts = [
      { name: "Dubai Marina", lat: 25.0701, lng: 55.1397, radius: 0.02 },
      { name: "Downtown Dubai", lat: 25.1972, lng: 55.2744, radius: 0.02 },
      { name: "Deira", lat: 25.2788, lng: 55.3242, radius: 0.03 },
      { name: "Jumeirah", lat: 25.2048, lng: 55.2708, radius: 0.03 },
      { name: "Al Quoz", lat: 25.1539, lng: 55.2362, radius: 0.02 },
      { name: "Business Bay", lat: 25.1857, lng: 55.2795, radius: 0.02 },
      { name: "JLT", lat: 25.0675, lng: 55.1376, radius: 0.015 },
      { name: "Palm Jumeirah", lat: 25.1124, lng: 55.1390, radius: 0.02 },
      { name: "Dubai Silicon Oasis", lat: 25.1279, lng: 55.3807, radius: 0.03 },
      { name: "Al Barsha", lat: 25.1112, lng: 55.2130, radius: 0.02 }
    ];

    // Find the closest district
    for (const district of districts) {
      const distance = Math.sqrt(
        Math.pow(lat - district.lat, 2) +
        Math.pow(lng - district.lng, 2)
      );

      if (distance <= district.radius) {
        return district.name;
      }
    }

    // If no district found, determine by general area
    if (lat > 25.2 && lng > 55.3) return "Deira";
    if (lat < 25.1 && lng < 55.2) return "Dubai Marina";

    return "Dubai"; // Default
  }

  // Get delivery statistics for a rider
  static async getRiderDeliveryStats(riderId: string, days: number = 7) {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .eq('rider_id', riderId)
        .gte('timestamp', cutoffDate);

      if (error) {
        console.error('Error fetching delivery stats:', error);
        return {
          totalDeliveries: 0,
          averagePerDay: 0,
          lastDelivery: null
        };
      }

      const deliveries = data || [];

      return {
        totalDeliveries: deliveries.length,
        averagePerDay: deliveries.length / days,
        lastDelivery: deliveries[0]?.timestamp ? new Date(deliveries[0].timestamp) : null
      };
    } catch (error) {
      console.error('Error in getRiderDeliveryStats:', error);
      return {
        totalDeliveries: 0,
        averagePerDay: 0,
        lastDelivery: null
      };
    }
  }
}
