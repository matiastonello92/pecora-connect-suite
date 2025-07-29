import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';

interface PendingInvitation {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  locations: string[];
  status: string;
  created_at: string;
  expires_at: string;
  invitation_token: string;
}

interface DeleteInvitationDialogProps {
  invitation: PendingInvitation;
  onDelete: (invitationId: string) => void;
}

export const DeleteInvitationDialog = ({ invitation, onDelete }: DeleteInvitationDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = () => {
    onDelete(invitation.id);
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the invitation for{' '}
            <span className="font-semibold">
              {invitation.first_name} {invitation.last_name}
            </span>{' '}
            ({invitation.email})? This will immediately expire the invitation link and the user will no longer be able to register using this invitation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Invitation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};