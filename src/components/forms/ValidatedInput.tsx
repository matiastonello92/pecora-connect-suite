import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/core/utils';

interface ValidatedInputProps extends React.ComponentProps<"input"> {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  containerClassName?: string;
}

/**
 * Input component with built-in validation display
 * Eliminates duplication of input field patterns
 */
export function ValidatedInput({
  label,
  error,
  hint,
  required,
  containerClassName,
  className,
  id,
  ...props
}: ValidatedInputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn('space-y-2', containerClassName)}>
      {label && (
        <Label htmlFor={inputId} className={cn(error && 'text-destructive')}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <Input
        id={inputId}
        className={cn(
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        {...props}
      />
      
      {hint && !error && (
        <p className="text-sm text-muted-foreground">{hint}</p>
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}