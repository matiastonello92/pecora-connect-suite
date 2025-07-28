import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, AlertTriangle } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EmailChangeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
}

export const EmailChangeDialog = ({ isOpen, onOpenChange, currentEmail }: EmailChangeDialogProps) => {
  
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEmail || !confirmEmail) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: 'destructive',
      });
      return;
    }

    if (newEmail !== confirmEmail) {
      toast({
        title: "Error",
        description: "Emails don't match",
        variant: 'destructive',
      });
      return;
    }

    if (newEmail === currentEmail) {
      toast({
        title: "Error",
        description: "New email cannot be the same as current email",
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email change initiated. Please check your email for verification",
      });

      onOpenChange(false);
      setNewEmail('');
      setConfirmEmail('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setNewEmail('');
    setConfirmEmail('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Change Email
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You will need to verify your new email address before it becomes active
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Current Email</Label>
            <Input value={currentEmail} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newEmail">New Email</Label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email address"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmEmail">Confirm New Email</Label>
            <Input
              id="confirmEmail"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Confirm new email address"
              disabled={isSubmitting}
              required
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !newEmail || !confirmEmail}
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              {isSubmitting ? "Processing..." : "Send Verification"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};