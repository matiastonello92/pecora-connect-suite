// Example of location-aware data implementation for Inventory Context
import { useEffectiveLocation, useLocationData } from '@/hooks/useLocationData';

// In any context or component that handles data operations:

export const useLocationAwareInventory = () => {
  const { effectiveLocation, isLocationRestricted } = useEffectiveLocation();
  const { getLocationForNewRecord } = useLocationData();

  // Example: Filter inventory items by location
  const getInventoryByLocation = (allItems: any[]) => {
    return allItems.filter(item => {
      // If user is location-restricted, only show items for their location
      if (isLocationRestricted) {
        return item.location === effectiveLocation;
      }
      // If user can switch locations, show items for the currently active location
      return item.location === effectiveLocation;
    });
  };

  // Example: Create new inventory item with correct location
  const createInventoryItem = (itemData: any) => {
    return {
      ...itemData,
      location: getLocationForNewRecord() // Automatically assigns correct location
    };
  };

  return {
    getInventoryByLocation,
    createInventoryItem,
    effectiveLocation,
    isLocationRestricted
  };
};