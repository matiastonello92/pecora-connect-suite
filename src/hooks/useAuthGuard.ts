import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';

/**
 * Enhanced auth guard hook with improved session management
 * Uses EnhancedAuth for better performance and caching
 */
export function useAuthGuard(requireAuth = true) {
  const { user, profile, isLoading } = useEnhancedAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && requireAuth && !user) {
      navigate('/login');
    }
  }, [user, isLoading, requireAuth, navigate]);

  return { 
    user, 
    profile, 
    isAuthenticated: !!user, 
    isLoading 
  };
}