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
import { RefreshCw } from 'lucide-react';
import { ArchivedUser } from '@/types/users';

interface ReactivateUserDialogProps {
  user: ArchivedUser;
  onReactivate: (userId: string) => void;
}

export const ReactivateUserDialog = ({ user, onReactivate }: ReactivateUserDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleReactivate = () => {
    onReactivate(user.id);
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          disabled={!user.canReactivate}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reactivate User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to reactivate{' '}
            <span className="font-semibold">
              {user.firstName} {user.lastName}
            </span>
            ? This will restore their access to the system
            {user.previousStatus === 'pending' ? ' and send a new invitation email.' : '.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReactivate}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            Reactivate User
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};