import { supabase } from '../../config/supabase';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Generic base service for Supabase CRUD operations
 * Provides reusable methods for common database operations
 */

export interface QueryOptions {
  select?: string;
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  offset?: number;
}

export interface FilterOptions {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in';
  value: any;
}

/**
 * Generic error handler for Supabase operations
 */
export const handleSupabaseError = (error: PostgrestError | null, operation: string) => {
  if (error) {
    console.error(`Supabase ${operation} error:`, error);
    throw new Error(error.message || `Failed to ${operation}`);
  }
};

/**
 * Base service class with generic CRUD operations
 */
export class BaseSupabaseService<T extends { id?: string | number }> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Get all records from the table
   */
  async getAll(options: QueryOptions = {}): Promise<T[]> {
    let query = supabase.from(this.tableName).select(options.select || '*');

    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? true });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    handleSupabaseError(error, 'fetch all records');
    return (data || []) as T[];
  }

  /**
   * Get a single record by ID
   */
  async getById(id: string | number): Promise<T | null> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      handleSupabaseError(error, 'fetch record by ID');
    }

    return data as T;
  }

  /**
   * Get records with custom filters
   */
  async getWhere(filters: FilterOptions[], options: QueryOptions = {}): Promise<T[]> {
    let query = supabase.from(this.tableName).select(options.select || '*');

    // Apply filters
    filters.forEach(filter => {
      switch (filter.operator) {
        case 'eq':
          query = query.eq(filter.column, filter.value);
          break;
        case 'neq':
          query = query.neq(filter.column, filter.value);
          break;
        case 'gt':
          query = query.gt(filter.column, filter.value);
          break;
        case 'gte':
          query = query.gte(filter.column, filter.value);
          break;
        case 'lt':
          query = query.lt(filter.column, filter.value);
          break;
        case 'lte':
          query = query.lte(filter.column, filter.value);
          break;
        case 'like':
          query = query.like(filter.column, filter.value);
          break;
        case 'ilike':
          query = query.ilike(filter.column, filter.value);
          break;
        case 'in':
          query = query.in(filter.column, filter.value);
          break;
      }
    });

    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending ?? true });
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    handleSupabaseError(error, 'fetch filtered records');
    return (data || []) as T[];
  }

  /**
   * Create a new record
   */
  async create(record: Omit<T, 'id'>): Promise<T> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert([record])
      .select()
      .single();

    handleSupabaseError(error, 'create record');
    return data as T;
  }

  /**
   * Create multiple records
   */
  async createMany(records: Omit<T, 'id'>[]): Promise<T[]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(records)
      .select();

    handleSupabaseError(error, 'create multiple records');
    return (data || []) as T[];
  }

  /**
   * Update a record by ID
   */
  async update(id: string | number, updates: Partial<T>): Promise<T> {
    const { data, error } = await supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    handleSupabaseError(error, 'update record');
    return data as T;
  }

  /**
   * Update multiple records matching filters
   */
  async updateWhere(filters: FilterOptions[], updates: Partial<T>): Promise<T[]> {
    let query = supabase.from(this.tableName).update(updates);

    filters.forEach(filter => {
      switch (filter.operator) {
        case 'eq':
          query = query.eq(filter.column, filter.value);
          break;
        case 'neq':
          query = query.neq(filter.column, filter.value);
          break;
        case 'gt':
          query = query.gt(filter.column, filter.value);
          break;
        case 'gte':
          query = query.gte(filter.column, filter.value);
          break;
        case 'lt':
          query = query.lt(filter.column, filter.value);
          break;
        case 'lte':
          query = query.lte(filter.column, filter.value);
          break;
        case 'in':
          query = query.in(filter.column, filter.value);
          break;
      }
    });

    const { data, error } = await query.select();

    handleSupabaseError(error, 'update filtered records');
    return (data || []) as T[];
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string | number): Promise<void> {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    handleSupabaseError(error, 'delete record');
  }

  /**
   * Delete multiple records matching filters
   */
  async deleteWhere(filters: FilterOptions[]): Promise<void> {
    let query = supabase.from(this.tableName).delete();

    filters.forEach(filter => {
      switch (filter.operator) {
        case 'eq':
          query = query.eq(filter.column, filter.value);
          break;
        case 'neq':
          query = query.neq(filter.column, filter.value);
          break;
        case 'in':
          query = query.in(filter.column, filter.value);
          break;
      }
    });

    const { error } = await query;

    handleSupabaseError(error, 'delete filtered records');
  }

  /**
   * Count records in the table
   */
  async count(filters?: FilterOptions[]): Promise<number> {
    let query = supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });

    if (filters) {
      filters.forEach(filter => {
        switch (filter.operator) {
          case 'eq':
            query = query.eq(filter.column, filter.value);
            break;
          case 'neq':
            query = query.neq(filter.column, filter.value);
            break;
          case 'gt':
            query = query.gt(filter.column, filter.value);
            break;
          case 'gte':
            query = query.gte(filter.column, filter.value);
            break;
          case 'lt':
            query = query.lt(filter.column, filter.value);
            break;
          case 'lte':
            query = query.lte(filter.column, filter.value);
            break;
          case 'in':
            query = query.in(filter.column, filter.value);
            break;
        }
      });
    }

    const { count, error } = await query;

    handleSupabaseError(error, 'count records');
    return count || 0;
  }

  /**
   * Check if a record exists by ID
   */
  async exists(id: string | number): Promise<boolean> {
    const record = await this.getById(id);
    return record !== null;
  }

  /**
   * Upsert a record (insert or update if exists)
   */
  async upsert(record: T): Promise<T> {
    const { data, error } = await supabase
      .from(this.tableName)
      .upsert([record])
      .select()
      .single();

    handleSupabaseError(error, 'upsert record');
    return data as T;
  }

  /**
   * Execute a raw SQL query (use with caution)
   */
  async executeRPC(functionName: string, params?: any): Promise<any> {
    const { data, error } = await supabase.rpc(functionName, params);

    handleSupabaseError(error, `execute RPC ${functionName}`);
    return data;
  }
}

/**
 * Helper function to create a service instance
 */
export const createService = <T extends { id?: string | number }>(tableName: string) => {
  return new BaseSupabaseService<T>(tableName);
};
