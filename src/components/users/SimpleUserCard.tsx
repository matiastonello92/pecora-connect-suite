import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserProfile } from '@/types/users';
import { Trash2 } from 'lucide-react';

interface SimpleUserCardProps {
  user: UserProfile;
  onDelete: (userId: string) => void;
}

export const SimpleUserCard: React.FC<SimpleUserCardProps> = ({ user, onDelete }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {user.firstName} {user.lastName}
          </CardTitle>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(user.user_id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <strong>Email:</strong> {user.email}
          </div>
          <div>
            <strong>Status:</strong> <Badge variant="outline">{user.status}</Badge>
          </div>
          <div>
            <strong>Locations:</strong> {user.locations?.join(', ') || 'None'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};