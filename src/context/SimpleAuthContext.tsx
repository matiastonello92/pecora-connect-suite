import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import { UserProfile } from '@/types/users';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SimpleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Profile fetch timeout')), 10000);
    });

    try {
      console.log('🔄 Fetching profile for user ID:', userId);
      
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (error) {
        console.error('❌ Error fetching profile:', error);
        return null;
      }

      if (!data) {
        console.warn('⚠️ No profile found for user:', userId);
        return null;
      }
      
      console.log('✅ Profile fetched successfully:', {
        user_id: data.user_id,
        email: data.email,
        locations: data.locations,
        role: data.role,
        status: data.status
      });
      
      // Map database profile to UserProfile interface
      return {
        user_id: data.user_id,
        email: data.email || '',
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        phone: data.phone,
        avatar: data.avatar_url,
        role: data.role,
        restaurantRole: data.restaurant_role,
        accessLevel: data.access_level || 'base',
        hasCustomPermissions: data.has_custom_permissions || false,
        department: data.department || '',
        position: data.position || '',
        employmentType: 'full-time',
        status: data.status || 'active',
        locations: data.locations || ['menton'],
        startDate: new Date(data.created_at || ''),
        permissions: [],
        customPermissions: [],
        lastLogin: data.last_login_at ? new Date(data.last_login_at) : undefined,
        createdAt: new Date(data.created_at || ''),
        updatedAt: new Date(data.updated_at || '')
      } as UserProfile;
    } catch (error) {
      console.error('❌ Exception during profile fetch:', error);
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...');
        
        // Set loading state immediately
        setState(prevState => ({
          ...prevState,
          isLoading: true
        }));
        
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Error getting session:', sessionError);
          setState({
            user: null,
            session: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false,
          });
          return;
        }
        
        console.log('📱 Session found:', !!session?.user, 'User ID:', session?.user?.id);
        
        let profile = null;
        if (session?.user) {
          console.log('👤 Fetching profile for user:', session.user.id);
          profile = await fetchProfile(session.user.id);
          
          if (!profile) {
            console.error('❌ Profile not found for authenticated user:', session.user.id);
          }
        }
        
        // User is authenticated if they have a session, profile is optional
        const isAuthenticated = !!session?.user;
        console.log('✅ Authentication complete:', { 
          hasSession: !!session?.user, 
          hasProfile: !!profile, 
          isAuthenticated,
          profileEmail: profile?.email,
          profileLocations: profile?.locations
        });
        
        setState({
          user: session?.user ?? null,
          session,
          profile,
          isLoading: false,
          isAuthenticated,
        });
      } catch (error) {
        console.error('❌ Error during auth initialization:', error);
        setState({
          user: null,
          session: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          console.log('🔄 Auth state changed:', event, 'User ID:', session?.user?.id);
          
          // Set loading state immediately
          setState(prevState => ({
            ...prevState,
            isLoading: true
          }));
          
          let profile = null;
          if (session?.user) {
            console.log('👤 Fetching profile after auth change for:', session.user.id);
            profile = await fetchProfile(session.user.id);
            
            if (!profile) {
              console.error('❌ Failed to fetch profile for authenticated user:', session.user.id);
            }
          }
          
          // User is authenticated if they have a session, profile is optional
          const isAuthenticated = !!session?.user;
          console.log('✅ Auth state update complete:', { 
            event, 
            hasSession: !!session?.user, 
            hasProfile: !!profile, 
            isAuthenticated,
            profileEmail: profile?.email,
            profileLocations: profile?.locations
          });
          
          setState({
            user: session?.user ?? null,
            session,
            profile,
            isLoading: false,
            isAuthenticated,
          });
        } catch (error) {
          console.error('❌ Error during auth state change:', error);
          setState({
            user: null,
            session: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useSimpleAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
};