/**
 * Enhanced Auth Provider
 * Advanced authentication with session management, caching, and security
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { SessionManager, type SessionData } from '@/core/auth/SessionManager';
import { UserProfile } from '@/types/users';

export interface EnhancedAuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionData: SessionData | null;
  lastActivity: Date | null;
  deviceFingerprint: string | null;
}

export interface EnhancedAuthContextType extends EnhancedAuthState {
  login: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  checkSessionHealth: () => boolean;
  getSessionMetrics: () => any;
}

const EnhancedAuthContext = createContext<EnhancedAuthContextType | undefined>(undefined);

export const EnhancedAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<EnhancedAuthState>({
    user: null,
    session: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
    sessionData: null,
    lastActivity: null,
    deviceFingerprint: null,
  });

  const [sessionManager] = useState(() => SessionManager.getInstance());
  const [profileCache, setProfileCache] = useState<Map<string, UserProfile>>(new Map());

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    // Check cache first
    if (profileCache.has(userId)) {
      return profileCache.get(userId)!;
    }

    try {
      console.log('🔄 Enhanced: Fetching profile for user ID:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Enhanced: Error fetching profile:', error);
        return null;
      }

      if (!data) {
        console.warn('⚠️ Enhanced: No profile found for user:', userId);
        return null;
      }
      
      const profile: UserProfile = {
        user_id: data.user_id,
        email: data.email || '',
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        phone: data.phone,
        avatar: data.avatar_url,
        role: data.role as any,
        restaurantRole: data.restaurant_role,
        accessLevel: data.access_level || 'base',
        hasCustomPermissions: data.has_custom_permissions || false,
        department: data.department || '',
        position: data.position || '',
        employmentType: 'full-time',
        status: (data.status || 'active') as any,
        locations: data.locations || ['menton'],
        startDate: new Date(data.created_at || ''),
        permissions: [],
        customPermissions: [],
        lastLogin: data.last_login_at ? new Date(data.last_login_at) : undefined,
        createdAt: new Date(data.created_at || ''),
        updatedAt: new Date(data.updated_at || '')
      };

      // Cache the profile
      setProfileCache(prev => new Map(prev).set(userId, profile));
      
      console.log('✅ Enhanced: Profile cached successfully:', {
        user_id: profile.user_id,
        email: profile.email,
        locations: profile.locations,
        role: profile.role,
        accessLevel: profile.accessLevel
      });
      
      return profile;
    } catch (error) {
      console.error('❌ Enhanced: Exception during profile fetch:', error);
      return null;
    }
  }, [profileCache]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!state.user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', state.user.id);

      if (error) throw error;

      // Update cache
      if (profileCache.has(state.user.id)) {
        const currentProfile = profileCache.get(state.user.id)!;
        const updatedProfile = { ...currentProfile, ...updates };
        setProfileCache(prev => new Map(prev).set(state.user.id, updatedProfile));
        
        setState(prevState => ({
          ...prevState,
          profile: updatedProfile
        }));
      }
    } catch (error) {
      console.error('❌ Enhanced: Profile update failed:', error);
      throw error;
    }
  }, [state.user, profileCache]);

  const handleSessionChange = useCallback(async (sessionData: SessionData | null) => {
    if (!sessionData || !sessionData.session || !sessionData.user) {
      setState({
        user: null,
        session: null,
        profile: null,
        isLoading: false,
        isAuthenticated: false,
        sessionData: null,
        lastActivity: null,
        deviceFingerprint: null,
      });
      return;
    }

    setState(prevState => ({
      ...prevState,
      isLoading: true
    }));

    let profile = null;
    if (sessionData.user) {
      profile = await fetchProfile(sessionData.user.id);
    }

    const isAuthenticated = !!sessionData.user;
    
    setState({
      user: sessionData.user,
      session: sessionData.session,
      profile,
      isLoading: false,
      isAuthenticated,
      sessionData,
      lastActivity: new Date(sessionData.lastActivity),
      deviceFingerprint: sessionData.deviceFingerprint,
    });
  }, [fetchProfile]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 Enhanced: Initializing authentication...');
        
        const sessionData = await sessionManager.initializeSession();
        await handleSessionChange(sessionData);
        
        // Set up session manager event listeners
        sessionManager.on('session-refreshed', handleSessionChange);
        sessionManager.on('session-logout', () => handleSessionChange(null));
        sessionManager.on('session-inactive', () => {
          console.warn('⚠️ Enhanced: Session inactive, logging out');
          logout();
        });
        
      } catch (error) {
        console.error('❌ Enhanced: Error during auth initialization:', error);
        setState(prevState => ({
          ...prevState,
          isLoading: false,
          isAuthenticated: false,
        }));
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Enhanced: Auth state changed:', event);
        
        if (event === 'SIGNED_OUT' || !session) {
          await handleSessionChange(null);
        } else if (session) {
          const sessionData = await sessionManager.initializeSession();
          await handleSessionChange(sessionData);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      sessionManager.destroy();
    };
  }, [sessionManager, handleSessionChange]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) return { error };

      // Session will be handled by onAuthStateChange
      return { error: null };
    } catch (error) {
      console.error('❌ Enhanced: Login failed:', error);
      return { error };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await sessionManager.logout();
      // Clear profile cache for security
      setProfileCache(new Map());
    } catch (error) {
      console.error('❌ Enhanced: Logout failed:', error);
    }
  }, [sessionManager]);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    return await sessionManager.refreshSession();
  }, [sessionManager]);

  const checkSessionHealth = useCallback((): boolean => {
    return sessionManager.isSessionValid();
  }, [sessionManager]);

  const getSessionMetrics = useCallback(() => {
    return {
      isValid: sessionManager.isSessionValid(),
      sessionData: state.sessionData,
      cacheSize: profileCache.size,
      lastActivity: state.lastActivity,
      deviceFingerprint: state.deviceFingerprint,
    };
  }, [sessionManager, state, profileCache]);

  const contextValue = useMemo((): EnhancedAuthContextType => ({
    ...state,
    login,
    logout,
    refreshSession,
    updateProfile,
    checkSessionHealth,
    getSessionMetrics,
  }), [
    state,
    login,
    logout,
    refreshSession,
    updateProfile,
    checkSessionHealth,
    getSessionMetrics,
  ]);

  return (
    <EnhancedAuthContext.Provider value={contextValue}>
      {children}
    </EnhancedAuthContext.Provider>
  );
};

export const useEnhancedAuth = () => {
  const context = useContext(EnhancedAuthContext);
  if (context === undefined) {
    throw new Error('useEnhancedAuth must be used within an EnhancedAuthProvider');
  }
  return context;
};