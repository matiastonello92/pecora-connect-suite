import React from 'react';
import { MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLocation } from '@/context/LocationContext';

export const LocationFilter: React.FC = () => {
  const { activeLocation, setActiveLocation, availableLocations, isViewingAllLocations } = useLocation();

  return (
    <div className="flex items-center space-x-2 px-3 py-2 bg-muted/30 rounded-lg border border-border">
      <MapPin className="h-4 w-4 text-muted-foreground" />
      <Select value={activeLocation} onValueChange={setActiveLocation}>
        <SelectTrigger className="h-8 w-auto min-w-[120px] bg-transparent border-none shadow-none focus:ring-0 text-sm">
          <div className="flex items-center space-x-2">
            <SelectValue />
            {isViewingAllLocations && (
              <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                All
              </Badge>
            )}
          </div>
        </SelectTrigger>
        <SelectContent>
          {availableLocations.map((location) => (
            <SelectItem key={location.value} value={location.value} className="text-sm">
              <div className="flex items-center space-x-2">
                <span>{location.label}</span>
                {location.value === 'all_locations' && (
                  <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                    All
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};