/**
 * BikeTrackerService - Adapter for backward compatibility
 * Now uses Supabase Realtime instead of Firebase onSnapshot
 *
 * This adapter maintains the same API so components don't need changes.
 */

export { BikeTrackerSupabaseService as BikeTrackerService, type BikeLocation } from './supabase/bikeTrackerSupabaseService';