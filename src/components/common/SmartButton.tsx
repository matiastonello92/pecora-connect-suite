import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useAsyncOperation } from '@/hooks/useAsyncOperation';

interface SmartButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick?: () => Promise<void> | void;
  asyncOperation?: () => Promise<any>;
  successMessage?: string;
  errorMessage?: string;
  loadingText?: string;
  confirmAction?: boolean;
  confirmMessage?: string;
}

/**
 * Smart button component that automatically handles loading states for async operations
 * Eliminates duplication of loading button patterns
 */
export function SmartButton({
  onClick,
  asyncOperation,
  successMessage,
  errorMessage,
  loadingText,
  confirmAction = false,
  confirmMessage = 'Are you sure?',
  children,
  disabled,
  ...props
}: SmartButtonProps) {
  const { execute, isLoading } = useAsyncOperation(
    asyncOperation || (async () => {
      if (onClick) {
        const result = onClick();
        if (result instanceof Promise) {
          await result;
        }
      }
    }),
    {
      successMessage,
      errorMessage
    }
  );

  const handleClick = async () => {
    if (confirmAction && !window.confirm(confirmMessage)) {
      return;
    }
    
    await execute();
  };

  return (
    <Button
      {...props}
      disabled={disabled || isLoading}
      onClick={handleClick}
    >
      {isLoading ? (
        <LoadingSpinner size="sm" text={loadingText || 'Loading...'} />
      ) : (
        children
      )}
    </Button>
  );
}