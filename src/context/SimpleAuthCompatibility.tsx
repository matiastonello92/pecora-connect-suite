/**
 * Backward Compatibility Layer for SimpleAuth
 * Provides the same interface as SimpleAuthContext but delegates to EnhancedAuthProvider
 */

import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';

/**
 * Backward compatibility hook that delegates to EnhancedAuth
 * @deprecated Use useEnhancedAuth directly for better performance and features
 */
export const useSimpleAuthCompat = () => {
  const enhanced = useEnhancedAuth();
  
  // Map enhanced auth to simple auth interface
  return {
    user: enhanced.user,
    profile: enhanced.profile,
    session: enhanced.session,
    isAuthenticated: enhanced.isAuthenticated,
    isLoading: enhanced.isLoading,
    login: enhanced.login,
    logout: enhanced.logout,
    refreshSession: enhanced.refreshSession,
    updateProfile: enhanced.updateProfile,
    // Add any other methods that SimpleAuth had
  };
};

// Re-export for drop-in replacement
export { useSimpleAuthCompat as useSimpleAuth };