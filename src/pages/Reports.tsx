import React, { useState, useEffect } from 'react';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { useReports } from '@/context/ReportsContext';
import { useLocation } from '@/context/LocationContext';

import { LocationAwareReports } from '@/components/reports/LocationAwareReports';

export const Reports = () => {
  const { activeLocation, availableLocations } = useLocation();

  // Check URL parameters for location preselection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const locationParam = urlParams.get('location');
    
    if (locationParam && availableLocations.some(loc => loc.value === locationParam)) {
      console.log(`Reports page: URL location parameter detected: ${locationParam}`);
      // Location switching is handled by LocationContext
    }
  }, [availableLocations]);

  return <LocationAwareReports />;
};
