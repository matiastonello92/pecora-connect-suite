import React from 'react';
import { AlertTriangle, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLocation } from '@/context/LocationContext';

export const LocationBlocker: React.FC = () => {
  const { 
    availableLocations, 
    setActiveLocation, 
    suggestedLocation, 
    acceptSuggestedLocation, 
    dismissSuggestedLocation,
    requestLocationPermission
  } = useLocation();

  if (suggestedLocation) {
    const locationName = availableLocations.find(loc => loc.value === suggestedLocation)?.label || suggestedLocation;
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          
          <h2 className="text-xl font-semibold text-foreground">
            You are near {locationName}
          </h2>
          
          <p className="text-muted-foreground">
            Switch your active location to access this restaurant's data?
          </p>
          
          <div className="flex gap-3 justify-center">
            <Button onClick={acceptSuggestedLocation} className="flex-1">
              Switch to {locationName}
            </Button>
            <Button variant="outline" onClick={dismissSuggestedLocation}>
              Stay Current
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        
        <h2 className="text-xl font-semibold text-foreground">
          Please select a location to continue
        </h2>
        
        <p className="text-muted-foreground">
          You need to select an active location to access the application.
        </p>
        
        {availableLocations.length > 0 ? (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Available locations:</div>
            <div className="flex flex-wrap gap-2 justify-center">
              {availableLocations.map((location) => (
                <Badge
                  key={location.value}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setActiveLocation(location.value)}
                >
                  {location.label}
                </Badge>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={requestLocationPermission}
              className="mt-4"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Use My Location
            </Button>
          </div>
        ) : (
          <div className="text-sm text-destructive">
            No locations assigned to your account. Please contact your administrator.
          </div>
        )}
      </Card>
    </div>
  );
};