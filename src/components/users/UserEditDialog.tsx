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
      open={isOpen}
      onOpenChange={onOpenChange}
      title="Edit User"
    >
      <div className="space-y-4">
        <div>
          <strong>User:</strong> {user.firstName} {user.lastName}
        </div>
        <div>
          <strong>Email:</strong> {user.email}
        </div>
        <div>
          <strong>Status:</strong> {user.status}
        </div>
        <div>
          <strong>Locations:</strong> {user.locations?.join(', ') || 'None'}
        </div>
      </div>
    </GenericUserDialog>
  );
};