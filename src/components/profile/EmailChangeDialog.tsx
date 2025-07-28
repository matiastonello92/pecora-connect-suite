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
        title: t('common.error'),
        description: t('profile.messages.fillAllFields'),
        variant: 'destructive',
      });
      return;
    }

    if (newEmail !== confirmEmail) {
      toast({
        title: t('common.error'),
        description: t('profile.messages.emailsDontMatch'),
        variant: 'destructive',
      });
      return;
    }

    if (newEmail === currentEmail) {
      toast({
        title: t('common.error'),
        description: t('profile.messages.sameEmailError'),
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
        title: t('common.success'),
        description: t('profile.messages.emailChangeInitiated'),
      });

      onOpenChange(false);
      setNewEmail('');
      setConfirmEmail('');
    } catch (error: any) {
      toast({
        title: t('common.error'),
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
            {t('profile.actions.changeEmail')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {t('profile.warnings.emailChangeWarning')}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>{t('profile.fields.currentEmail')}</Label>
            <Input value={currentEmail} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newEmail">{t('profile.fields.newEmail')}</Label>
            <Input
              id="newEmail"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={t('profile.placeholders.enterNewEmail')}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmEmail">{t('profile.fields.confirmNewEmail')}</Label>
            <Input
              id="confirmEmail"
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={t('profile.placeholders.confirmNewEmail')}
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
              {t('common.cancel')}
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
              {isSubmitting ? t('profile.actions.processing') : t('profile.actions.sendVerification')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};