/**
 * Audit Service
 * Consolidated audit logging from utils/*Audit.ts files
 */

import { supabase } from '@/integrations/supabase/client';

export interface AuditLog {
  action: string;
  resource_type: string;
  resource_id?: string;
  user_id?: string;
  location_id?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
}

export class AuditService {
  static async log(entry: AuditLog): Promise<void> {
    try {
      // Log to console for now - audit table will be created later
      console.log('Audit Log:', {
        ...entry,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  static async logUserAction(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      user_id: userId,
      metadata,
    });
  }

  static async logLocationAction(
    locationId: string,
    action: string,
    resourceType: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action,
      resource_type: resourceType,
      location_id: locationId,
      user_id: userId,
      metadata,
    });
  }

  static async getAuditLogs(filters?: {
    userId?: string;
    locationId?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    // Return empty array for now - audit table will be created later
    console.log('Getting audit logs with filters:', filters);
    return { data: [], error: null };
  }
}