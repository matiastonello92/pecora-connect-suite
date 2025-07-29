import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimpleAuth } from '@/context/SimpleAuthContext';

/**
 * Hook centralizzato per gestione autenticazione e redirect
 * Elimina duplicazione di logica di autenticazione tra componenti
 */
export function useAuthGuard(requireAuth = true) {
  const { user, profile, isLoading } = useSimpleAuth();
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