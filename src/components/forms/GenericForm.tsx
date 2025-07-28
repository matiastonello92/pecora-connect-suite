import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { FlexLayout } from '@/components/ui/layouts/FlexLayout';

interface GenericFormProps {
  onSubmit: (e: React.FormEvent) => void;
  children: ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isLoading?: boolean;
  showActions?: boolean;
  className?: string;
}

export const GenericForm = ({
  onSubmit,
  children,
  submitLabel = "Submit",
  cancelLabel = "Cancel", 
  onCancel,
  isLoading = false,
  showActions = true,
  className = ""
}: GenericFormProps) => {
  return (
    <form onSubmit={onSubmit} className={`space-y-4 ${className}`}>
      {children}
      
      {showActions && (
        <FlexLayout justify="end" gap="sm" className="pt-4 border-t">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {submitLabel}...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </FlexLayout>
      )}
    </form>
  );
};