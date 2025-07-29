import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import type { ZodSchema } from 'zod';

/**
 * Hook per gestione form con validazione e stati async
 * Elimina duplicazione di logica di form validation e submission
 */
export function useAsyncForm<T>(
  schema: ZodSchema<T>,
  onSubmit: (data: T) => Promise<void>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    resetOnSuccess?: boolean;
  }
) {
  const form = useForm<T>({ 
    resolver: zodResolver(schema) 
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = form.handleSubmit(async (data) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      
      toast({ 
        title: "Success", 
        description: options?.successMessage || "Operation completed successfully" 
      });
      
      if (options?.resetOnSuccess !== false) {
        form.reset();
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      
      toast({ 
        title: "Error", 
        description: options?.errorMessage || error.message || "An error occurred", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return { 
    form, 
    handleSubmit, 
    isSubmitting,
    reset: form.reset,
    setValue: form.setValue,
    watch: form.watch,
    errors: form.formState.errors
  };
}