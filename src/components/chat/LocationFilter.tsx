import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { useActiveLocations } from '@/hooks/useLocations';

interface LocationFilterProps {
  onLocationChange: (location: string | 'all_locations') => void;
  selectedLocation: string | 'all_locations';
}

export const LocationFilter: React.FC<LocationFilterProps> = ({ 
  onLocationChange, 
  selectedLocation 
}) => {
  const { profile } = useSimpleAuth();
  const { data: activeLocations = [] } = useActiveLocations();
  
  // Get user's accessible locations from their profile
  const userLocations = profile?.locations || [];
  
  // Filter active locations to only show ones the user has access to
  const accessibleLocations = activeLocations.filter(loc => 
    userLocations.includes(loc.code)
  );

  return (
    <div className="flex items-center space-x-2 px-3 py-2 bg-muted/30 rounded-lg border border-border">
      <MapPin className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedLocation} onValueChange={onLocationChange}>
        <SelectTrigger className="h-8 w-auto min-w-[120px] bg-transparent border-none shadow-none focus:ring-0 text-sm">
          <div className="flex items-center space-x-2">
            <span>
              {selectedLocation === 'all_locations' 
                ? 'All Locations' 
                : accessibleLocations.find(loc => loc.code === selectedLocation)?.name || selectedLocation
              }
            </span>
            {selectedLocation === 'all_locations' && (
              <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                {userLocations.length}
              </Badge>
            )}
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all_locations" className="text-sm">
            <div className="flex items-center space-x-2">
              <span>All Locations</span>
              <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                {userLocations.length}
              </Badge>
            </div>
          </SelectItem>
          {accessibleLocations.map((location) => (
            <SelectItem key={location.code} value={location.code} className="text-sm">
              {location.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};