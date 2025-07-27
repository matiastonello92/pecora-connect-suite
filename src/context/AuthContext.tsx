import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Language } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { authRateLimiter, validatePassword, updateLastActivity, getLastActivity, isSessionExpired } from '@/utils/security';
import { InvitationData, RestaurantRole, AccessLevel, AppModule, ModulePermissions } from '@/types/users';

export type UserRole = 'base' | 'manager' | 'super_admin';
export type Department = 'kitchen' | 'pizzeria' | 'service' | 'finance' | 'manager' | 'super_manager' | 'general_manager';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: Department;
  location: string;
  language: Language;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  role: string;
  location: string;
  department?: string;
  position?: string;
  phone?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  language: Language;
}

type AuthAction =
  | { type: 'AUTH_SUCCESS'; payload: { user: User; session: Session } }
  | { type: 'AUTH_FAILURE' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

const initialState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true, // Start with true to show loading while checking session
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
        language: action.payload.user.language,
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
        user: state.user ? { ...state.user, language: action.payload } : null,
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
  logout: () => void;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  setLanguage: (language: Language) => void;
  updateUser: (updates: Partial<User>) => void;
  hasPermission: (requiredRole: UserRole) => boolean;
  hasAccess: (departments: Department[]) => boolean;
  createInvitation: (data: InvitationData) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions
const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return null;
    }

    if (!data) {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
};

const transformProfileToUser = (profile: Profile, supabaseUser: SupabaseUser): User => {
  const user = {
    id: profile.user_id,
    email: supabaseUser.email || '',
    firstName: profile.first_name,
    lastName: profile.last_name,
    role: profile.role as UserRole,
    department: (profile.department || 'service') as Department,
    location: profile.location,
    language: 'en' as Language, // Default to English, can be updated later
    isActive: profile.status === 'active' || profile.status == null,
    createdAt: new Date(profile.created_at),
    updatedAt: new Date(profile.updated_at),
  };
  
  return user;
};

const updateUserProfile = async (updates: Partial<User>): Promise<void> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const profileUpdates: any = {};
    
    if (updates.firstName) profileUpdates.first_name = updates.firstName;
    if (updates.lastName) profileUpdates.last_name = updates.lastName;
    if (updates.role) profileUpdates.role = updates.role;
    if (updates.department) profileUpdates.department = updates.department;
    if (updates.location) profileUpdates.location = updates.location;
    if (updates.isActive !== undefined) profileUpdates.status = updates.isActive ? 'active' : 'inactive';

    const { error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('user_id', userData.user.id);

    if (error) {
      // Handle error silently
    }
  } catch (error) {
    // Handle error silently
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
        
        // Update last activity
        updateLastActivity();
        
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
      updateUserProfile(updates);
    }
  };

  const createInvitation = async (data: InvitationData): Promise<{ error?: string }> => {
    try {
      const invitationData = {
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role,
        restaurant_role: data.restaurantRole || null,
        access_level: data.accessLevel,
        location: data.location,
        invited_by: state.user?.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: data.customPermissions ? JSON.stringify({ customPermissions: data.customPermissions }) : JSON.stringify({})
      };

      const { data: inviteResult, error } = await supabase
        .from('user_invitations')
        .insert(invitationData)
        .select()
        .single();

      if (error) {
        return { error: error.message };
      }

      // Send invitation email
      try {
        await supabase.functions.invoke('send-invitation-email', {
          body: {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
            location: data.location,
            invitationToken: inviteResult.invitation_token,
            invitedByName: `${state.user?.firstName} ${state.user?.lastName}`,
          }
        });
      } catch (emailError) {
        // Don't return error for email sending failure - invitation is still created
        console.warn('Failed to send invitation email:', emailError);
      }

      return {};
    } catch (error: any) {
      return { error: error.message || 'Failed to create invitation' };
    }
  };

  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!state.user) return false;
    
    const roleHierarchy = {
      base: 0,
      manager: 1,
      super_admin: 2,
    };
    
    return roleHierarchy[state.user.role as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole as keyof typeof roleHierarchy];
  };

  const hasAccess = (departments: Department[]): boolean => {
    if (!state.user) return false;
    if (state.user.role === 'super_admin') return true;
    return departments.includes(state.user.department as Department);
  };

  // Set up session timeout monitoring
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const checkSessionTimeout = () => {
      const lastActivity = getLastActivity();
      if (isSessionExpired(lastActivity)) {
        logout();
      }
    };

    // Check session timeout every minute
    const timeoutInterval = setInterval(checkSessionTimeout, 60000);

    // Update activity on user interaction
    const updateActivity = () => updateLastActivity();
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      clearInterval(timeoutInterval);
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [state.isAuthenticated]);

  // Check for existing session and set up auth listener
  useEffect(() => {
    let isMounted = true;
    
    // Force loading to false after a reasonable timeout to prevent infinite loading
    const forceLoadingTimeout = setTimeout(() => {
      if (isMounted) {
        // Try one more time to get session before giving up
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user && isMounted) {
            setTimeout(async () => {
              if (!isMounted) return;
              const profile = await fetchUserProfile(session.user.id);
              if (profile && isMounted) {
                const user = transformProfileToUser(profile, session.user);
                dispatch({ type: 'AUTH_SUCCESS', payload: { user, session } });
              } else if (isMounted) {
                dispatch({ type: 'AUTH_FAILURE' });
              }
            }, 50);
          } else if (isMounted) {
            dispatch({ type: 'AUTH_FAILURE' });
          }
        }).catch(() => {
          if (isMounted) dispatch({ type: 'AUTH_FAILURE' });
        });
      }
    }, 1500);

    const handleAuthState = (event: string, session: any) => {
      if (!isMounted) return;
      
      clearTimeout(forceLoadingTimeout);
      
      if (session?.user) {
        setTimeout(async () => {
          if (!isMounted) return;
          
          try {
            const profile = await fetchUserProfile(session.user.id);
            if (profile && isMounted) {
              const user = transformProfileToUser(profile, session.user);
              dispatch({ type: 'AUTH_SUCCESS', payload: { user, session } });
            } else if (isMounted) {
              dispatch({ type: 'AUTH_FAILURE' });
            }
          } catch (error) {
            if (isMounted) {
              dispatch({ type: 'AUTH_FAILURE' });
            }
          }
        }, 100);
      } else if (isMounted) {
        dispatch({ type: 'AUTH_FAILURE' });
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthState);

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      
      clearTimeout(forceLoadingTimeout);
      
      if (error || !session?.user) {
        dispatch({ type: 'AUTH_FAILURE' });
        return;
      }

      setTimeout(async () => {
        if (!isMounted) return;
        
        try {
          const profile = await fetchUserProfile(session.user.id);
          if (profile && isMounted) {
            const user = transformProfileToUser(profile, session.user);
            dispatch({ type: 'AUTH_SUCCESS', payload: { user, session } });
          } else if (isMounted) {
            dispatch({ type: 'AUTH_FAILURE' });
          }
        } catch (error) {
          if (isMounted) {
            dispatch({ type: 'AUTH_FAILURE' });
          }
        }
      }, 100);
    }).catch(() => {
      if (isMounted) {
        dispatch({ type: 'AUTH_FAILURE' });
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(forceLoadingTimeout);
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