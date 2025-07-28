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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔐 Initializing authentication...');
        
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('📱 Session found:', !!session?.user, session?.user?.id);
        
        let profile = null;
        if (session?.user) {
          console.log('👤 Fetching profile for user:', session.user.id);
          profile = await fetchProfile(session.user.id);
          console.log('👤 Profile fetched:', !!profile, profile?.email, profile?.locations);
        }
        
        const isAuthenticated = !!session?.user && !!profile;
        console.log('✅ Authentication complete:', { 
          hasSession: !!session?.user, 
          hasProfile: !!profile, 
          isAuthenticated 
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
          console.log('🔄 Auth state changed:', event, !!session?.user);
          
          let profile = null;
          if (session?.user) {
            console.log('👤 Fetching profile after auth change for:', session.user.id);
            profile = await fetchProfile(session.user.id);
            console.log('👤 Profile after auth change:', !!profile, profile?.email, profile?.locations);
          }
          
          const isAuthenticated = !!session?.user && !!profile;
          console.log('✅ Auth state update complete:', { 
            event, 
            hasSession: !!session?.user, 
            hasProfile: !!profile, 
            isAuthenticated 
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