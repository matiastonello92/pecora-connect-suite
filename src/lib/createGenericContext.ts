import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { toast } from 'sonner';

export interface GenericContextState<T> {
  loading: boolean;
  error: string | null;
  data: T;
}

export type GenericAction<T> = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_DATA'; payload: T }
  | { type: 'UPDATE_DATA'; payload: Partial<T> };

export function createGenericReducer<T>() {
  return (state: GenericContextState<T>, action: GenericAction<T>): GenericContextState<T> => {
    switch (action.type) {
      case 'SET_LOADING':
        return { ...state, loading: action.payload };
      case 'SET_ERROR':
        return { ...state, error: action.payload, loading: false };
      case 'SET_DATA':
        return { ...state, data: action.payload, loading: false, error: null };
      case 'UPDATE_DATA':
        return { 
          ...state, 
          data: Array.isArray(state.data) 
            ? state.data 
            : { ...state.data as object, ...action.payload } as T
        };
      default:
        return state;
    }
  };
}

export interface GenericContextOptions<T> {
  contextName: string;
  initialData: T;
  loadData?: () => Promise<T>;
  onError?: (error: string) => void;
}

export function createGenericContext<T, Methods = Record<string, unknown>>(
  options: GenericContextOptions<T>
) {
  const { contextName, initialData, loadData, onError } = options;
  
  type ContextType = GenericContextState<T> & Methods & {
    dispatch: React.Dispatch<GenericAction<T>>;
    reload: () => Promise<void>;
  };

  const Context = createContext<ContextType | undefined>(undefined);

  const useContextHook = () => {
    const context = useContext(Context);
    if (!context) {
      throw new Error(`use${contextName} must be used within a ${contextName}Provider`);
    }
    return context;
  };

  interface ProviderProps {
    children: ReactNode;
    methods?: Methods;
  }

  const Provider: React.FC<ProviderProps> = ({ children, methods }) => {
    const { profile } = useSimpleAuth();
    const reducer = createGenericReducer<T>();
    const [state, dispatch] = useReducer(reducer, {
      loading: false,
      error: null,
      data: initialData
    });

    const handleError = (error: string) => {
      dispatch({ type: 'SET_ERROR', payload: error });
      if (onError) {
        onError(error);
      } else {
        toast.error(error);
      }
    };

    const reload = async () => {
      if (!loadData || !profile) return;
      
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const data = await loadData();
        dispatch({ type: 'SET_DATA', payload: data });
      } catch (error: any) {
        handleError(`Failed to load ${contextName.toLowerCase()}: ${error.message}`);
      }
    };

    useEffect(() => {
      if (profile && loadData) {
        reload();
      }
    }, [profile]);

    const contextValue = {
      ...state,
      ...(methods || {} as Methods),
      dispatch,
      reload
    } as ContextType;

    return React.createElement(Context.Provider, { value: contextValue }, children);
  };

  return { Provider, useContext: useContextHook, Context };
}