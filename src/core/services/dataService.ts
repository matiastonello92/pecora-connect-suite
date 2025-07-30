/**
 * Data Service
 * Centralizes database operations
 */

import { supabase } from '@/integrations/supabase/client';
import type { PaginationParams, PaginatedResponse } from '../types';

export class DataService {
  static async query<T>(
    table: string,
    options?: {
      select?: string;
      filters?: Record<string, any>;
      orderBy?: { column: string; ascending: boolean };
      pagination?: PaginationParams;
    }
  ): Promise<{ data: T[] | null; error: any }> {
    // Generic query builder - will be typed properly when used with specific tables
    let query = (supabase as any).from(table);

    if (options?.select) {
      query = query.select(options.select);
    } else {
      query = query.select('*');
    }

    if (options?.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy.column, { 
        ascending: options.orderBy.ascending 
      });
    }

    if (options?.pagination) {
      const { page, limit } = options.pagination;
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      query = query.range(start, end);
    }

    return await query;
  }

  static async insert<T>(table: string, data: Partial<T>) {
    return await (supabase as any).from(table).insert(data);
  }

  static async update<T>(table: string, id: string, data: Partial<T>) {
    return await (supabase as any).from(table).update(data).eq('id', id);
  }

  static async delete(table: string, id: string) {
    return await (supabase as any).from(table).delete().eq('id', id);
  }

  static async findById<T>(table: string, id: string): Promise<{ data: T | null; error: any }> {
    return await (supabase as any).from(table).select('*').eq('id', id).maybeSingle();
  }
}