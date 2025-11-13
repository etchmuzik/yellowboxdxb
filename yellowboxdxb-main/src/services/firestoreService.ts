/**
 * Firestore Service - Adapter for backward compatibility
 * Now uses Supabase services under the hood
 *
 * This adapter maintains the same API for generic Firestore operations.
 */

import { supabase } from '@/config/supabase';

export class FirestoreService {
  static async getDocument(collection: string, id: string) {
    const { data, error } = await supabase
      .from(collection)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getCollection(collection: string) {
    const { data, error } = await supabase
      .from(collection)
      .select('*');

    if (error) throw error;
    return data || [];
  }

  static async addDocument(collection: string, data: any) {
    const { data: result, error } = await supabase
      .from(collection)
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  static async updateDocument(collection: string, id: string, data: any) {
    const { error } = await supabase
      .from(collection)
      .update(data)
      .eq('id', id);

    if (error) throw error;
  }

  static async deleteDocument(collection: string, id: string) {
    const { error } = await supabase
      .from(collection)
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
