import React from 'react';
import { AlertTriangle, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from '@/context/LocationContext';

interface LocationAwareReportWrapperProps {
  children: React.ReactNode;
  reportType: string;
}

export const LocationAwareReportWrapper: React.FC<LocationAwareReportWrapperProps> = ({ 
  children, 
  reportType 
}) => {
  const { activeLocation, isLocationBlocked, availableLocations, requestLocationPermission } = useLocation();

  if (isLocationBlocked || !activeLocation) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          
          <h3 className="text-lg font-semibold text-foreground">
            Location Required for {reportType}
          </h3>
          
          <p className="text-muted-foreground">
            Please select a location before generating reports. Reports are location-specific to ensure data accuracy.
          </p>
          
          {availableLocations.length > 0 && (
            <Button 
              onClick={requestLocationPermission}
              className="mt-4"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Detect My Location
            </Button>
          )}
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};