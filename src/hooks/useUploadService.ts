/**
 * Upload Service Hook
 * Separates file upload business logic from UI components
 * Phase 3: Business Logic Separation
 */

import { useState, useCallback } from 'react';
import { UploadService, type UploadOptions } from '@/core/services';
import { useToast } from '@/hooks/use-toast';

export interface UseUploadServiceOptions {
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}

export function useUploadService(options: UseUploadServiceOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      const errorMessage = `File size must be less than ${(options.maxSize / 1024 / 1024).toFixed(1)}MB`;
      setError(errorMessage);
      toast({
        title: 'Upload Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    }

    // Check file type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      const errorMessage = `File type not allowed. Allowed types: ${options.allowedTypes.join(', ')}`;
      setError(errorMessage);
      toast({
        title: 'Upload Error',
        description: errorMessage,
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const upload = useCallback(async (uploadOptions: UploadOptions) => {
    if (!validateFile(uploadOptions.file)) {
      return { success: false, error: error || 'File validation failed' };
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const { data, error: uploadError } = await UploadService.uploadFile(uploadOptions);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) {
        const errorMessage = uploadError.message || 'Upload failed';
        setError(errorMessage);
        options.onError?.(errorMessage);
        toast({
          title: 'Upload Failed',
          description: errorMessage,
          variant: 'destructive'
        });
        return { success: false, error: errorMessage };
      }

      const publicUrl = UploadService.getPublicUrl(uploadOptions.bucket, uploadOptions.path);
      
      options.onSuccess?.(publicUrl);
      toast({
        title: 'Upload Complete',
        description: 'File uploaded successfully'
      });

      return { success: true, url: publicUrl, data };
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [error, options, toast]);

  const deleteFile = useCallback(async (bucket: string, path: string) => {
    setError(null);
    
    try {
      const { error: deleteError } = await UploadService.deleteFile(bucket, path);
      
      if (deleteError) {
        const errorMessage = deleteError.message || 'Delete failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      toast({
        title: 'File Deleted',
        description: 'File deleted successfully'
      });

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [toast]);

  const getSignedUrl = useCallback(async (bucket: string, path: string, expiresIn?: number) => {
    try {
      const { data, error: urlError } = await UploadService.createSignedUrl(bucket, path, expiresIn);
      
      if (urlError) {
        throw new Error(urlError.message);
      }

      return { success: true, url: data?.signedUrl };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create signed URL';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const clearError = () => setError(null);

  return {
    upload,
    deleteFile,
    getSignedUrl,
    isUploading,
    uploadProgress,
    error,
    clearError
  };
}