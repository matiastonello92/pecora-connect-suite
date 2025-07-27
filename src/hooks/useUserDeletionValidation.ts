import { useEffect, useState } from 'react';
import { validateUserManagementIntegrity, auditUserDeletions } from '@/utils/userDeletionAudit';
import { useToast } from '@/hooks/use-toast';

interface ValidationState {
  isValidating: boolean;
  hasIssues: boolean;
  errors: string[];
  warnings: string[];
  lastValidated: Date | null;
}

/**
 * Hook to automatically validate user management integrity
 * and alert when issues are detected
 */
export const useUserDeletionValidation = (enableAutoValidation = true) => {
  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    hasIssues: false,
    errors: [],
    warnings: [],
    lastValidated: null
  });
  const { toast } = useToast();

  const runValidation = async () => {
    setValidationState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const [integrityResult, auditResult] = await Promise.all([
        validateUserManagementIntegrity(),
        auditUserDeletions()
      ]);

      const allErrors = [...integrityResult.errors, ...auditResult.issues];
      const allWarnings = integrityResult.warnings;
      const hasIssues = !integrityResult.passed || !auditResult.isValid;

      setValidationState({
        isValidating: false,
        hasIssues,
        errors: allErrors,
        warnings: allWarnings,
        lastValidated: new Date()
      });

      // Alert user if critical issues are found
      if (allErrors.length > 0) {
        toast({
          title: "User Management Issues Detected",
          description: `Found ${allErrors.length} critical issues. Check console for details.`,
          variant: "destructive",
        });
        console.error('User management validation errors:', allErrors);
      } else if (allWarnings.length > 0) {
        console.warn('User management validation warnings:', allWarnings);
      } else {
        console.log('User management validation passed');
      }

    } catch (error: any) {
      setValidationState({
        isValidating: false,
        hasIssues: true,
        errors: [`Validation failed: ${error.message}`],
        warnings: [],
        lastValidated: new Date()
      });
    }
  };

  // Auto-validate on mount and periodically if enabled
  useEffect(() => {
    if (!enableAutoValidation) return;

    // Run initial validation
    runValidation();

    // Set up periodic validation (every 5 minutes)
    const interval = setInterval(runValidation, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [enableAutoValidation]);

  return {
    ...validationState,
    runValidation
  };
};