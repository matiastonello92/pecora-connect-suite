import { supabase } from '@/integrations/supabase/client';

export interface InvitationValidationResult {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
  invitationData?: any;
}

export const validateInvitationToken = async (token: string): Promise<InvitationValidationResult> => {
  try {
    console.log('Validating invitation token:', token);
    
    // Use the database function for comprehensive validation
    const { data, error } = await supabase
      .rpc('validate_invitation_token', { token_to_check: token });

    if (error) {
      console.error('Database error during token validation:', error);
      return {
        isValid: false,
        errorCode: 'DATABASE_ERROR',
        errorMessage: 'Failed to validate invitation. Please try again.'
      };
    }

    if (!data || data.length === 0) {
      return {
        isValid: false,
        errorCode: 'VALIDATION_FAILED',
        errorMessage: 'Unable to validate invitation token.'
      };
    }

    const result = data[0];
    console.log('Token validation result:', result);

    return {
      isValid: result.is_valid,
      errorCode: result.error_code,
      errorMessage: result.error_message,
      invitationData: result.invitation_data
    };
  } catch (error) {
    console.error('Error validating invitation token:', error);
    return {
      isValid: false,
      errorCode: 'SYSTEM_ERROR',
      errorMessage: 'System error during validation. Please try again.'
    };
  }
};

export const getInvitationErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'TOKEN_NOT_FOUND':
      return 'Invalid invitation token. Please check your email for the correct link or contact your administrator.';
    case 'ALREADY_USED':
      return 'This invitation has already been used. If you need access, please contact your administrator for a new invitation.';
    case 'EXPIRED':
      return 'This invitation has expired. Please contact your administrator for a new invitation.';
    case 'INVALID_STATUS':
      return 'This invitation is no longer valid. Please contact your administrator for a new invitation.';
    case 'DATABASE_ERROR':
      return 'Failed to validate invitation. Please try again or contact support.';
    case 'VALIDATION_FAILED':
      return 'Unable to validate invitation token. Please try again.';
    case 'SYSTEM_ERROR':
      return 'System error during validation. Please try again.';
    default:
      return 'Unknown error occurred. Please contact support.';
  }
};

export const cleanupExpiredInvitations = async (): Promise<void> => {
  try {
    const { error } = await supabase.rpc('cleanup_expired_invitations');
    if (error) {
      console.error('Failed to cleanup expired invitations:', error);
    }
  } catch (error) {
    console.error('Error during invitation cleanup:', error);
  }
};