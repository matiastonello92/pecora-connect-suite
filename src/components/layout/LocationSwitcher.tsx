import React from 'react';
import { MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocation } from '@/context/LocationContext';

export const LocationSwitcher: React.FC = () => {
  const { activeLocation, setActiveLocation, canSwitchLocations, availableLocations } = useLocation();

  if (!canSwitchLocations) {
    return null;
  }

  return (
    <div className="px-3 py-2 border-t border-border">
      <div className="flex items-center space-x-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <Select value={activeLocation} onValueChange={setActiveLocation}>
          <SelectTrigger className="h-8 w-full bg-transparent border-none shadow-none focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableLocations.map((location) => (
              <SelectItem key={location.value} value={location.value}>
                {location.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};