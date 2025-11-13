// Adapter file: Re-exports Supabase bikeService
// All existing component imports will now use Supabase

export {
  getBikes,
  getAllBikes,
  getBikeById,
  createBike,
  updateBike,
  deleteBike,
  getBikesByStatus,
  getBikeByGpsTrackerId,
  getBikeByRiderId,
  assignBikeToRider,
  unassignBike
} from './supabase/bikeSupabaseService';
