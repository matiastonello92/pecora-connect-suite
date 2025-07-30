import React from 'react';
import { Textarea, TextareaProps } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ValidatedTextareaProps extends TextareaProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  containerClassName?: string;
  maxLength?: number;
  showCharCount?: boolean;
}

/**
 * Textarea component with built-in validation display
 * Eliminates duplication of textarea field patterns
 */
export function ValidatedTextarea({
  label,
  error,
  hint,
  required,
  containerClassName,
  className,
  id,
  maxLength,
  showCharCount,
  value,
  ...props
}: ValidatedTextareaProps) {
  const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className={cn('space-y-2', containerClassName)}>
      {label && (
        <div className="flex justify-between items-center">
          <Label htmlFor={inputId} className={cn(error && 'text-destructive')}>
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </Label>
          
          {showCharCount && maxLength && (
            <span className={cn(
              'text-sm',
              currentLength > maxLength ? 'text-destructive' : 'text-muted-foreground'
            )}>
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      )}
      
      <Textarea
        id={inputId}
        className={cn(
          error && 'border-destructive focus-visible:ring-destructive',
          className
        )}
        value={value}
        maxLength={maxLength}
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