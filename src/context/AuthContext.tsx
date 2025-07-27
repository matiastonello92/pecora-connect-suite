import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { validatePassword } from '@/utils/security';
import { createError, showErrorToUser } from '@/utils/errorHandling';

export type Language = 'en' | 'fr' | 'it';

// Re-export types from users.ts for compatibility
export type { UserRole, AccessLevel, RestaurantRole, AppModule } from '@/types/users';

// Rate limiting for login attempts
class RateLimiter {
  private attempts: Map<string, { count: number; firstAttempt: number }> = new Map();
  private maxAttempts = 5;
  private windowMs = 15 * 60 * 1000; // 15 minutes

  isAllowed(email: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(email);
    
    if (!userAttempts) {
      this.attempts.set(email, { count: 1, firstAttempt: now });
      return true;
    }
    
    if (now - userAttempts.firstAttempt > this.windowMs) {
      this.attempts.set(email, { count: 1, firstAttempt: now });
      return true;
    }
    
    if (userAttempts.count >= this.maxAttempts) {
      return false;
    }
    
    userAttempts.count++;
    return true;
  }
  
  getRemainingTime(email: string): number {
    const userAttempts = this.attempts.get(email);
    if (!userAttempts) return 0;
    
    return Math.max(0, this.windowMs - (Date.now() - userAttempts.firstAttempt));
  }
  
  reset(email: string): void {
    this.attempts.delete(email);
  }
}

const authRateLimiter = new RateLimiter();

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  language: Language;
  location: string;
  locations: string[];
  accessLevel: string;
  restaurantRole?: string;
  department?: string;
  position?: string;
  avatarUrl?: string;
  phone?: string;
  hasCustomPermissions?: boolean;
}

export interface Profile {
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  role: string;
  restaurant_role?: string;
  access_level: string;
  location: string;
  locations?: string[];
  department?: string;
  position?: string;
  avatar_url?: string;
  phone?: string;
  has_custom_permissions?: boolean;
}

interface AuthState {
  user: User | null;
  session: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  language: Language;
}

type AuthAction =
  | { type: 'AUTH_SUCCESS'; payload: { user: User; session: any } }
  | { type: 'AUTH_FAILURE' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

const initialState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  language: 'en',
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        session: action.payload.session,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_LANGUAGE':
      return {
        ...state,
        language: action.payload,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  setLanguage: (language: Language) => void;
  updateUser: (updates: Partial<User>) => void;
  hasPermission: (permission: string, module?: string) => boolean;
  hasAccess: (requiredRole: string | string[]) => boolean;
  createInvitation: (invitationData: any) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions
const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    console.log('🔍 Starting profile fetch for user:', userId);
    console.log('🔍 Auth state before profile fetch:', { uid: userId, timestamp: new Date().toISOString() });
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

    if (error) {
      console.error('❌ Error fetching user profile:', error);
      console.error('❌ Error details:', { code: error.code, message: error.message, details: error.details });
      return null;
    }

    if (!data) {
      console.warn('⚠️ No profile found for user:', userId);
      return null;
    }

    console.log('✅ Profile fetched successfully:', { 
      userId: data.user_id, 
      email: data.email, 
      role: data.role,
      timestamp: new Date().toISOString()
    });
    
    return data;
  } catch (error) {
    console.error('💥 Exception fetching user profile:', error);
    console.error('💥 Exception details:', { 
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return null;
  }
};

const transformProfileToUser = (profile: Profile, authUser: any): User => {
  return {
    id: profile.user_id,
    email: profile.email || authUser.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
    role: profile.role,
    language: 'en', // Default language
    location: profile.location,
    locations: profile.locations || [profile.location],
    accessLevel: profile.access_level,
    restaurantRole: profile.restaurant_role,
    department: profile.department,
    position: profile.position,
    avatarUrl: profile.avatar_url,
    phone: profile.phone,
    hasCustomPermissions: profile.has_custom_permissions || false,
  };
};

const updateUserProfile = async (updates: Partial<User>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: updates.firstName,
        last_name: updates.lastName,
        phone: updates.phone,
        position: updates.position,
        department: updates.department,
      })
      .eq('user_id', updates.id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    // Rate limiting check
    if (!authRateLimiter.isAllowed(email)) {
      const remainingTime = Math.ceil(authRateLimiter.getRemainingTime(email) / 60000);
      dispatch({ type: 'AUTH_FAILURE' });
      return { error: `Too many login attempts. Please try again in ${remainingTime} minutes.` };
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        dispatch({ type: 'AUTH_FAILURE' });
        return { error: error.message };
      }

      if (data.user && data.session) {
        // Reset rate limiter on successful login
        authRateLimiter.reset(email);
        
        // Fetch user profile from database
        const profile = await fetchUserProfile(data.user.id);
        if (profile) {
          const user = transformProfileToUser(profile, data.user);
          dispatch({ type: 'AUTH_SUCCESS', payload: { user, session: data.session } });
          return {};
        } else {
          dispatch({ type: 'AUTH_FAILURE' });
          return { error: 'User profile not found' };
        }
      } else {
        dispatch({ type: 'AUTH_FAILURE' });
        return { error: 'Authentication failed' };
      }
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE' });
      return { error: error.message || 'Authentication failed' };
    }
  };

  const signUp = async (email: string, password: string): Promise<{ error?: string }> => {
    // Validate password strength
    const validation = validatePassword(password);
    if (!validation.isValid) {
      return { error: validation.errors.join('. ') };
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/complete-signup`
        }
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error: any) {
      return { error: error.message || 'Signup failed' };
    }
  };

  const resetPassword = async (email: string): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error: any) {
      return { error: error.message || 'Password reset failed' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    dispatch({ type: 'AUTH_FAILURE' });
  };

  const setLanguage = (language: Language) => {
    dispatch({ type: 'SET_LANGUAGE', payload: language });
    // Update language in database if user is logged in
    if (state.user && state.session) {
      updateUserProfile({ language });
    }
  };

  const updateUser = (updates: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
    // Update user profile in database
    if (state.user && state.session) {
      updateUserProfile({ ...state.user, ...updates });
    }
  };

  const hasPermission = (permission: string, module?: string): boolean => {
    if (!state.user) return false;
    
    // Basic role-based permissions
    const role = state.user.role;
    
    if (role === 'super_admin') return true;
    if (role === 'manager') return true;
    
    // Add more specific permission logic here
    return false;
  };

  const hasAccess = (requiredRole: string | string[]): boolean => {
    if (!state.user) return false;
    
    const userRole = state.user.role;
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    return roles.includes(userRole);
  };

  const createInvitation = async (invitationData: any): Promise<{ error?: string }> => {
    try {
      const { error } = await supabase
        .from('user_invitations')
        .insert(invitationData);

      if (error) {
        return { error: error.message };
      }

      return {};
    } catch (error: any) {
      return { error: error.message || 'Failed to create invitation' };
    }
  };

  // Set up authentication state listener with improved session handling
  useEffect(() => {
    let isMounted = true;
    let initTimeout: NodeJS.Timeout;

    const handleAuthState = async (event: string, session: any) => {
      console.log('🔐 Auth state change:', event, !!session?.user);
      
      if (!isMounted) return;
      
      if (session?.user) {
        try {
          console.log('👤 Fetching profile for user:', session.user.id);
          const profile = await fetchUserProfile(session.user.id);
          if (profile && isMounted) {
            const user = transformProfileToUser(profile, session.user);
            console.log('✅ Auth success with profile:', user.email);
            dispatch({ type: 'AUTH_SUCCESS', payload: { user, session } });
            
            // Notify other components that auth is ready
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('authReady', { 
                detail: { user, session } 
              }));
            }, 100);
          } else if (isMounted) {
            console.warn('⚠️ No profile found, auth failure');
            dispatch({ type: 'AUTH_FAILURE' });
          }
        } catch (error) {
          console.error('❌ Error in auth state handler:', error);
          if (isMounted) {
            dispatch({ type: 'AUTH_FAILURE' });
          }
        }
      } else if (isMounted) {
        console.log('🚫 No session, auth failure');
        dispatch({ type: 'AUTH_FAILURE' });
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthState);

    // Initialize session check with timeout
    const initializeAuth = async () => {
      try {
        console.log('🔍 Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
          if (isMounted) dispatch({ type: 'AUTH_FAILURE' });
          return;
        }

        if (session?.user) {
          console.log('✅ Found existing session');
          await handleAuthState('INITIAL_SESSION', session);
        } else {
          console.log('🚫 No existing session');
          if (isMounted) dispatch({ type: 'AUTH_FAILURE' });
        }
      } catch (error) {
        console.error('❌ Error initializing auth:', error);
        if (isMounted) dispatch({ type: 'AUTH_FAILURE' });
      }
    };

    // Initialize immediately
    initializeAuth();

    // Set timeout fallback
    initTimeout = setTimeout(() => {
      if (isMounted && state.isLoading) {
        console.log('⏰ Auth initialization timeout, forcing completion');
        dispatch({ type: 'AUTH_FAILURE' });
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    signUp,
    resetPassword,
    setLanguage,
    updateUser,
    hasPermission,
    hasAccess,
    createInvitation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};