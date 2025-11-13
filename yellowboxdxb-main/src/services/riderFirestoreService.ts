/**
 * Rider Firestore Service - Adapter for backward compatibility
 * Now uses Supabase services under the hood
 *
 * This adapter maintains the same API so legacy components don't need changes.
 */

export {
  RiderSupabaseService as RiderFirestoreService,
  riderSupabaseService as riderFirestoreService
} from './supabase/riderSupabaseService';
