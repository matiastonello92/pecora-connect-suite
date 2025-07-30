import React, { ReactNode } from 'react';
import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';
import { supabase } from '@/integrations/supabase/client';

interface PermissionGateProps {
  module: string;
  permission: string;
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Componente per controllo permessi dichiarativo
 * Elimina duplicazione di logica di controllo permessi
 */
export function PermissionGate({ 
  module, 
  permission, 
  fallback = null, 
  children 
}: PermissionGateProps) {
  const { profile } = useEnhancedAuth();
  
  // Simuliamo il controllo permessi (in produzione useremo la funzione Supabase)
  const checkPermission = () => {
    if (!profile) return false;
    
    // Logica base di controllo permessi
    const userRole = profile.role;
    const accessLevel = profile.accessLevel;
    
    // Admin e manager hanno tutti i permessi
    if (userRole === 'super_admin' || userRole === 'manager') return true;
    
    // Base logic per moduli specifici
    if (module === 'chat' || module === 'equipment') return permission === 'read';
    if (module === 'inventory_sala' || module === 'inventory_kitchen') {
      return ['read', 'write'].includes(permission);
    }
    
    return false;
  };
  
  const hasPermission = checkPermission();
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}