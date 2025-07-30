/**
 * Upload Service
 * Centralizes file upload logic
 */

import { supabase } from '@/integrations/supabase/client';

export interface UploadOptions {
  bucket: string;
  path: string;
  file: File;
  upsert?: boolean;
}

export class UploadService {
  static async uploadFile({ bucket, path, file, upsert = false }: UploadOptions) {
    return await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert });
  }

  static async deleteFile(bucket: string, path: string) {
    return await supabase.storage
      .from(bucket)
      .remove([path]);
  }

  static getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  static async createSignedUrl(bucket: string, path: string, expiresIn: number = 3600) {
    return await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
  }

  static async listFiles(bucket: string, path?: string) {
    return await supabase.storage
      .from(bucket)
      .list(path);
  }
}