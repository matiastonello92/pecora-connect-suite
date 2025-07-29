import React from 'react';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const AuthDebugPanel: React.FC = () => {
  const { user, session, profile, isLoading, isAuthenticated } = useSimpleAuth();

  // Only show in development
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-auto z-50 bg-background/95 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">🔍 Auth Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <strong>isLoading:</strong> {isLoading ? '✅' : '❌'}
          </div>
          <div>
            <strong>isAuthenticated:</strong> {isAuthenticated ? '✅' : '❌'}
          </div>
        </div>
        
        <div>
          <strong>Session:</strong>
          <pre className="text-xs bg-muted p-2 rounded mt-1 max-h-20 overflow-auto">
            {session ? JSON.stringify({
              user_id: session.user?.id,
              email: session.user?.email,
              expires_at: session.expires_at
            }, null, 2) : 'null'}
          </pre>
        </div>

        <div>
          <strong>User:</strong>
          <pre className="text-xs bg-muted p-2 rounded mt-1 max-h-20 overflow-auto">
            {user ? JSON.stringify({
              id: user.id,
              email: user.email,
              created_at: user.created_at
            }, null, 2) : 'null'}
          </pre>
        </div>

        <div>
          <strong>Profile:</strong>
          <pre className="text-xs bg-muted p-2 rounded mt-1 max-h-20 overflow-auto">
            {profile ? JSON.stringify({
              user_id: profile.user_id,
              email: profile.email,
              role: profile.role,
              access_level: profile.accessLevel,
              locations: profile.locations,
              status: profile.status
            }, null, 2) : 'null'}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};