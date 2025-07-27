import React from 'react';
import { MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLocation } from '@/context/LocationContext';

export const LocationFilter: React.FC = () => {
  const { activeLocation, setActiveLocation, availableLocations, canSwitchLocations } = useLocation();

  // Chat module supports multi-location view, show all user locations
  return (
    <div className="flex items-center space-x-2 px-3 py-2 bg-muted/30 rounded-lg border border-border">
      <MapPin className="h-4 w-4 text-muted-foreground" />
      <Select value="all_locations" onValueChange={() => {}}>
        <SelectTrigger className="h-8 w-auto min-w-[120px] bg-transparent border-none shadow-none focus:ring-0 text-sm">
          <div className="flex items-center space-x-2">
            <span>All Locations</span>
            <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
              Multi
            </Badge>
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all_locations" className="text-sm">
            <div className="flex items-center space-x-2">
              <span>All Locations</span>
              <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                Multi
              </Badge>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};