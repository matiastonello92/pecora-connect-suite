import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';
import { useLocationState } from '@/context/LocationStateContext';
import { useActiveLocations } from '@/hooks/useLocations';

export const LocationSystemTest: React.FC = () => {
  const { user, profile, isLoading: authLoading } = useEnhancedAuth();
  const { 
    activeLocation, 
    availableLocations, 
    canSwitchLocations, 
    isLocationBlocked,
    isLoadingUserLocations 
  } = useLocationState();
  const { data: allLocations = [], isLoading: locationsLoading } = useActiveLocations();

  if (authLoading || isLoadingUserLocations || locationsLoading) {
    return <div>Loading location system test...</div>;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Location System Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Authentication Status</h4>
          <div className="space-y-1">
            <p>User ID: {user?.id || 'None'}</p>
            <p>Email: {user?.email || 'None'}</p>
            <p>Profile Locations: {profile?.locations?.join(', ') || 'None'}</p>
            <p>Access Level: {profile?.accessLevel || 'None'}</p>
            <p>Role: {profile?.role || 'None'}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Available Locations (from DB)</h4>
          <div className="flex gap-2">
            {allLocations.map(location => (
              <Badge key={location.code} variant="outline">
                {location.name} ({location.code})
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">User Accessible Locations</h4>
          <div className="flex gap-2">
            {availableLocations.map(location => (
              <Badge key={location.value} variant="secondary">
                {location.label} ({location.value})
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Location State</h4>
          <div className="space-y-1">
            <p>Active Location: {activeLocation || 'None'}</p>
            <p>Can Switch Locations: {canSwitchLocations ? 'Yes' : 'No'}</p>
            <p>Is Location Blocked: {isLocationBlocked ? 'Yes' : 'No'}</p>
          </div>
        </div>

        <div className="pt-4">
          <Badge variant={isLocationBlocked ? "destructive" : "default"}>
            {isLocationBlocked ? 'LOCATION ACCESS BLOCKED' : 'LOCATION ACCESS OK'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};