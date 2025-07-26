import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Language } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type UserRole = 'base' | 'manager' | 'director' | 'finance' | 'super_admin';
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
  createInvitation: (email: string, firstName: string, lastName: string, role: UserRole, location: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions
const fetchUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

const transformProfileToUser = (profile: Profile, supabaseUser: SupabaseUser): User => {
  return {
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
      console.error('Error updating user profile:', error);
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
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

  const createInvitation = async (
    email: string, 
    firstName: string, 
    lastName: string, 
    role: UserRole, 
    location: string
  ): Promise<{ error?: string }> => {
    try {
      const { data, error } = await supabase.from('user_invitations').insert({
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        location,
        invited_by: state.user?.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      }).select().single();

      if (error) {
        return { error: error.message };
      }

      // Send invitation email
      try {
        await supabase.functions.invoke('send-invitation-email', {
          body: {
            email,
            firstName,
            lastName,
            role,
            location,
            invitationToken: data.invitation_token,
            invitedByName: `${state.user?.firstName} ${state.user?.lastName}`,
          }
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Don't return error for email sending failure - invitation is still created
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
      director: 2,
      finance: 1,
      super_admin: 3,
    };
    
    return roleHierarchy[state.user.role as keyof typeof roleHierarchy] >= roleHierarchy[requiredRole as keyof typeof roleHierarchy];
  };

  const hasAccess = (departments: Department[]): boolean => {
    if (!state.user) return false;
    if (state.user.role === 'super_admin') return true;
    return departments.includes(state.user.department as Department);
  };

  // Check for existing session and set up auth listener
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (profile) {
            const user = transformProfileToUser(profile, session.user);
            dispatch({ type: 'AUTH_SUCCESS', payload: { user, session } });
          } else {
            dispatch({ type: 'AUTH_FAILURE' });
          }
        } else {
          dispatch({ type: 'AUTH_FAILURE' });
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setTimeout(async () => {
          const profile = await fetchUserProfile(session.user.id);
          if (profile) {
            const user = transformProfileToUser(profile, session.user);
            dispatch({ type: 'AUTH_SUCCESS', payload: { user, session } });
          } else {
            dispatch({ type: 'AUTH_FAILURE' });
          }
        }, 0);
      } else {
        dispatch({ type: 'AUTH_FAILURE' });
      }
    });

    return () => subscription.unsubscribe();
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