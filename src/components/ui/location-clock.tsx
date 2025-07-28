import React, { useState, useEffect } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { useLocation } from '@/context/LocationContext';
import { formatDateForLocation, getCurrentTimeForLocation, DATE_FORMATS, getDateLocale } from '@/lib/timezone';


interface LocationClockProps {
  className?: string;
  showLocation?: boolean;
  format?: string;
}

export const LocationClock: React.FC<LocationClockProps> = ({ 
  className = '',
  showLocation = true,
  format = DATE_FORMATS.ITALIAN_DATE
}) => {
  const { profile } = useSimpleAuth();
  const { activeLocation, canSwitchLocations } = useLocation();
  const language = 'en'; // Temporarily hardcode language
  const { t } = useTranslation(language);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Determine effective location for timezone
  const effectiveLocation = canSwitchLocations ? activeLocation : 'menton'; // Default to menton

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(getCurrentTimeForLocation(effectiveLocation));
    };

    // Update immediately
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [effectiveLocation]);

  const formattedTime = formatDateForLocation(currentTime, effectiveLocation, format, getDateLocale(language));
  
  const getLocationDisplayName = () => {
    if (!effectiveLocation || effectiveLocation === 'all_locations') {
      return t('common.allLocations');
    }
    
    const locationNames = {
      menton: 'Menton',
      monaco: 'Monaco',
      nice: 'Nice', 
      cannes: 'Cannes',
      antibes: 'Antibes',
      lyon: 'Lyon'
    };
    
    return locationNames[effectiveLocation as keyof typeof locationNames] || effectiveLocation;
  };

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      <div className="flex items-center space-x-1">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono font-medium tabular-nums">
          {formattedTime}
        </span>
      </div>
      
      {showLocation && (
        <div className="flex items-center space-x-1 text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="text-xs capitalize">
            {getLocationDisplayName()}
          </span>
        </div>
      )}
    </div>
  );
};