import React, { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  center?: boolean;
  variant?: 'spinner' | 'skeleton' | 'dots';
  className?: string;
}

/**
 * Componente standardizzato per stati di loading
 * Elimina duplicazione di UI loading tra componenti
 */
export function LoadingSpinner({ 
  size = 'md', 
  text, 
  center = false,
  variant = 'spinner',
  className
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  const renderContent = () => {
    switch (variant) {
      case 'skeleton':
        return (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        );
      
      case 'dots':
        return (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            {text && <span className="ml-2">{text}</span>}
          </div>
        );
      
      default:
        return (
          <div className="flex items-center gap-2">
            <Loader2 className={cn(sizeClasses[size], 'animate-spin')} />
            {text && <span>{text}</span>}
          </div>
        );
    }
  };

  const content = renderContent();
  
  if (center) {
    return (
      <div className={cn("flex justify-center items-center p-4", className)}>
        {content}
      </div>
    );
  }
  
  return <div className={className}>{content}</div>;
}

/**
 * Componente per stati di loading a schermo intero
 */
export function FullPageLoader({ 
  text = "Loading..." 
}: { 
  text?: string 
}) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

/**
 * Hook per gestire stati di loading multipli
 */
export function useLoadingStates(initialStates: Record<string, boolean> = {}) {
  const [loadingStates, setLoadingStates] = React.useState(initialStates);

  const setLoading = React.useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }));
  }, []);

  const isLoading = React.useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = React.useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  return { setLoading, isLoading, isAnyLoading, loadingStates };
}