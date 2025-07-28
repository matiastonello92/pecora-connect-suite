import { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, LucideIcon } from 'lucide-react';

interface DialogLayoutProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  onSave?: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  isSaving?: boolean;
  showFooter?: boolean;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const DialogLayout = ({
  isOpen,
  onOpenChange,
  title,
  icon: Icon,
  children,
  onSave,
  onCancel,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  isSaving = false,
  showFooter = true,
  className = "",
  maxWidth = 'md'
}: DialogLayoutProps) => {
  const maxWidthClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
    '2xl': 'sm:max-w-2xl'
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={`${maxWidthClasses[maxWidth]} max-w-[95vw] max-h-[90vh] overflow-y-auto ${className}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5" />}
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {children}
        </div>

        {showFooter && (
          <DialogFooter className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              {cancelLabel}
            </Button>
            {onSave && (
              <Button
                onClick={onSave}
                disabled={isSaving}
                className="bg-primary hover:bg-primary/90"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  saveLabel
                )}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};