import { supabase } from '../../config/supabase';
import { Bike } from '../../types';

const TABLE_NAME = "bikes";

export const getBikes = async (): Promise<Bike[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*');

  if (error) {
    console.error("Error fetching bikes:", error);
    throw error;
  }

  return data || [];
};

// Alias for consistency with other services
export const getAllBikes = getBikes;

export const getBikeById = async (bikeId: string): Promise<Bike | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', bikeId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error("Error fetching bike:", error);
    throw error;
  }

  return data;
};

export const createBike = async (bikeData: Omit<Bike, "id">): Promise<Bike> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert([bikeData])
    .select()
    .single();

  if (error) {
    console.error("Error creating bike:", error);
    throw error;
  }

  return data;
};

export const updateBike = async (bikeId: string, bikeData: Partial<Bike>): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .update(bikeData)
    .eq('id', bikeId);

  if (error) {
    console.error("Error updating bike:", error);
    throw error;
  }
};

export const deleteBike = async (bikeId: string): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', bikeId);

  if (error) {
    console.error("Error deleting bike:", error);
    throw error;
  }
};

export const getBikesByStatus = async (status: Bike['status']): Promise<Bike[]> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('status', status);

  if (error) {
    console.error("Error fetching bikes by status:", error);
    throw error;
  }

  return data || [];
};

export const getBikeByGpsTrackerId = async (gpsTrackerId: string): Promise<Bike | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('gpsTrackerId', gpsTrackerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error("Error fetching bike by GPS tracker:", error);
    throw error;
  }

  return data;
};

export const getBikeByRiderId = async (riderId: string): Promise<Bike | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('assignedRiderId', riderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error("Error fetching bike by rider:", error);
    throw error;
  }

  return data;
};

export const assignBikeToRider = async (bikeId: string, riderId: string): Promise<void> => {
  const { error } = await supabase
    .from(TABLE_NAME)
    .update({
      assignedRiderId: riderId,
      status: 'Assigned'
    })
    .eq('id', bikeId);

  if (error) {
    console.error("Error assigning bike:", error);
    throw error;
  }

  // Log activity
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('activity_logs')
        .insert([{
          user_id: user.id,
          action: 'assign_bike',
          entity_type: 'bike',
          entity_id: bikeId,
          details: { riderId },
          timestamp: new Date().toISOString()
        }]);
    }
  } catch (logError) {
    console.error("Error logging activity:", logError);
  }
};

export const unassignBike = async (bikeId: string): Promise<void> => {
  // Get the bike to find the rider ID for logging
  const bike = await getBikeById(bikeId);
  const riderId = bike?.assignedRiderId;

  const { error } = await supabase
    .from(TABLE_NAME)
    .update({
      assignedRiderId: null,
      status: 'Available'
    })
    .eq('id', bikeId);

  if (error) {
    console.error("Error unassigning bike:", error);
    throw error;
  }

  // Log activity if there was a rider assigned
  if (riderId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('activity_logs')
          .insert([{
            user_id: user.id,
            action: 'unassign_bike',
            entity_type: 'bike',
            entity_id: bikeId,
            details: { riderId },
            timestamp: new Date().toISOString()
          }]);
      }
    } catch (logError) {
      console.error("Error logging activity:", logError);
    }
  }
};
