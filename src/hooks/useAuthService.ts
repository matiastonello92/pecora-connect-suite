/**
 * Auth Service Hook
 * Separates authentication business logic from UI components
 * Phase 3: Business Logic Separation
 */

import { useState } from 'react';
import { AuthService } from '@/core/services';
import { useToast } from '@/hooks/use-toast';

export interface UseAuthServiceOptions {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  redirectTo?: string;
}

export function useAuthService(options: UseAuthServiceOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await AuthService.signIn(email, password);
      
      if (error) {
        const errorMessage = error.message || 'Authentication failed';
        setError(errorMessage);
        options.onError?.(errorMessage);
        toast({
          title: 'Authentication Error',
          description: errorMessage,
          variant: 'destructive'
        });
        return { success: false, error: errorMessage };
      }

      options.onSuccess?.(data.user);
      toast({
        title: 'Welcome back!',
        description: 'You have been successfully signed in.'
      });
      
      return { success: true, user: data.user };
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await AuthService.signOut();
      
      if (error) {
        const errorMessage = error.message || 'Sign out failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      toast({
        title: 'Signed out',
        description: 'You have been successfully signed out.'
      });
      
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await AuthService.resetPassword(email);
      
      if (error) {
        const errorMessage = error.message || 'Password reset failed';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      toast({
        title: 'Password reset sent',
        description: 'Check your email for password reset instructions.'
      });
      
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    signIn,
    signOut,
    resetPassword,
    isLoading,
    error,
    clearError
  };
}