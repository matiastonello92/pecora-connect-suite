import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  access_level: string;
  location: string;
  locations: string[];
  department: string;
  position: string;
  status: string;
  has_custom_permissions: boolean;
}

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

  const fetchProfile = async (userId: string) => {
    try {
      console.log('🔄 Fetching profile for user ID:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no profile exists
      
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
      
      return data;
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
        
        const isAuthenticated = !!session?.user && !!profile;
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
          
          const isAuthenticated = !!session?.user && !!profile;
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