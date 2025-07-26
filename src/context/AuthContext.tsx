import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Language } from '@/lib/i18n';

export type UserRole = 'base' | 'manager' | 'director' | 'finance' | 'super_admin';
export type Department = 'kitchen' | 'pizzeria' | 'service' | 'finance' | 'manager' | 'super_manager';

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

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  language: Language;
}

type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LANGUAGE'; payload: Language }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  language: 'en',
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        language: action.payload.language,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setLanguage: (language: Language) => void;
  updateUser: (updates: Partial<User>) => void;
  hasPermission: (requiredRole: UserRole) => boolean;
  hasAccess: (departments: Department[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Mock authentication - replace with real auth system
  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data - in real app, this comes from your backend
      const mockUser: User = {
        id: '1',
        email: 'Matias@pecoranegra.fr',
        firstName: 'Matias',
        lastName: 'Tonello',
        role: 'super_admin', // General Manager with super admin access
        department: 'super_manager', // Full access to all departments
        location: 'PecoraNegra',
        language: 'fr', // French as default for Matias
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      localStorage.setItem('user', JSON.stringify(mockUser));
      dispatch({ type: 'LOGIN_SUCCESS', payload: mockUser });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
  };

  const setLanguage = (language: Language) => {
    dispatch({ type: 'SET_LANGUAGE', payload: language });
    if (state.user) {
      localStorage.setItem('user', JSON.stringify({ ...state.user, language }));
    }
  };

  const updateUser = (updates: Partial<User>) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
    if (state.user) {
      const updatedUser = { ...state.user, ...updates };
      localStorage.setItem('user', JSON.stringify(updatedUser));
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

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      } catch {
        localStorage.removeItem('user');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    setLanguage,
    updateUser,
    hasPermission,
    hasAccess,
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