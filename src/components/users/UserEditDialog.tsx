import { GenericUserDialog } from './GenericUserDialog';
import { UserProfile } from '@/types/users';

interface UserEditDialogProps {
  user: UserProfile;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

export const UserEditDialog = ({ user, isOpen, onOpenChange, onUserUpdated }: UserEditDialogProps) => {
  return (
    <GenericUserDialog
      user={user}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      onUserSaved={onUserUpdated}
      mode="edit"
    />
  );
};