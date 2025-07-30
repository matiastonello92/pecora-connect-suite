import React from 'react';
import { UserProfile } from '@/types/users';
import { SimpleUserCard } from '@/components/users/SimpleUserCard';

interface SimpleUserListProps {
  users: UserProfile[];
  onDelete: (userId: string) => void;
}

export const SimpleUserList: React.FC<SimpleUserListProps> = ({ users, onDelete }) => {
  return (
    <div className="grid gap-4">
      {users.map((user) => (
        <SimpleUserCard
          key={user.user_id}
          user={user}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};