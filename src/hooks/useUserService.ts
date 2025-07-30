/**
 * User Service Hook
 * Separates user management business logic from UI components
 * Phase 3: Business Logic Separation
 */

import { useState, useCallback } from 'react';
import { DataService } from '@/core/services';
import { useToast } from '@/hooks/use-toast';

export interface UseUserServiceOptions {
  onUserCreated?: (user: any) => void;
  onUserUpdated?: (user: any) => void;
  onUserDeleted?: (userId: string) => void;
}

export function useUserService(options: UseUserServiceOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const inviteUser = useCallback(async (userData: {
    email: string;
    role: string;
    locationId?: string;
    permissions?: string[];
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await DataService.insert('user_invitations', {
        email: userData.email,
        role: userData.role,
        location_id: userData.locationId,
        permissions: userData.permissions,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      });
      
      if (error) {
        const errorMessage = error.message || 'Failed to send invitation';
        setError(errorMessage);
        toast({
          title: 'Invitation Error',
          description: errorMessage,
          variant: 'destructive'
        });
        return { success: false, error: errorMessage };
      }

      toast({
        title: 'Invitation Sent',
        description: `Invitation sent to ${userData.email}`
      });

      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateUser = useCallback(async (userId: string, updates: {
    role?: string;
    permissions?: string[];
    status?: 'active' | 'inactive' | 'suspended';
    locationId?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await DataService.update('profiles', userId, {
        ...updates,
        updated_at: new Date().toISOString()
      });
      
      if (error) {
        const errorMessage = error.message || 'Failed to update user';
        setError(errorMessage);
        toast({
          title: 'Update Error',
          description: errorMessage,
          variant: 'destructive'
        });
        return { success: false, error: errorMessage };
      }

      options.onUserUpdated?.(data);
      toast({
        title: 'User Updated',
        description: 'User information has been updated successfully'
      });

      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [options, toast]);

  const deactivateUser = useCallback(async (userId: string, reason?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await DataService.update('profiles', userId, {
        status: 'inactive',
        deactivated_at: new Date().toISOString(),
        deactivation_reason: reason,
        updated_at: new Date().toISOString()
      });
      
      if (error) {
        const errorMessage = error.message || 'Failed to deactivate user';
        setError(errorMessage);
        toast({
          title: 'Deactivation Error',
          description: errorMessage,
          variant: 'destructive'
        });
        return { success: false, error: errorMessage };
      }

      options.onUserDeleted?.(userId);
      toast({
        title: 'User Deactivated',
        description: 'User has been deactivated successfully'
      });

      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [options, toast]);

  const resendInvitation = useCallback(async (invitationId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await DataService.update('user_invitations', invitationId, {
        status: 'pending',
        resent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
      
      if (error) {
        const errorMessage = error.message || 'Failed to resend invitation';
        setError(errorMessage);
        toast({
          title: 'Resend Error',
          description: errorMessage,
          variant: 'destructive'
        });
        return { success: false, error: errorMessage };
      }

      toast({
        title: 'Invitation Resent',
        description: 'Invitation has been resent successfully'
      });

      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const validateUserDeletion = useCallback(async (userId: string) => {
    try {
      // Check for dependencies
      const checks = await Promise.all([
        DataService.query('chat_participants', { filters: { user_id: userId } }),
        DataService.query('inventory_sessions', { filters: { created_by: userId } }),
        DataService.query('financial_transactions', { filters: { created_by: userId } })
      ]);

      const dependencies = {
        chats: checks[0].data?.length || 0,
        inventorySessions: checks[1].data?.length || 0,
        financialTransactions: checks[2].data?.length || 0
      };

      const canDelete = Object.values(dependencies).every(count => count === 0);

      return {
        canDelete,
        dependencies,
        message: canDelete 
          ? 'User can be safely deleted'
          : 'User has dependencies that must be resolved first'
      };
    } catch (err: any) {
      return {
        canDelete: false,
        dependencies: {},
        message: 'Unable to validate user deletion',
        error: err.message
      };
    }
  }, []);

  const clearError = () => setError(null);

  return {
    inviteUser,
    updateUser,
    deactivateUser,
    resendInvitation,
    validateUserDeletion,
    isLoading,
    error,
    clearError
  };
}