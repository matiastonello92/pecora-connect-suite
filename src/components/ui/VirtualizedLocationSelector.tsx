import React, { useState, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLocationMeta, useLocationState } from '@/context/OptimizedLocationProvider';

/**
 * VirtualizedLocationSelector: High-performance location selector
 * Handles thousands of locations with search, filtering, and lazy loading
 */

interface LocationItem {
  code: string;
  name: string;
  hierarchy: Record<string, any>;
  depth: number;
  fullPath: string;
}

interface VirtualizedLocationSelectorProps {
  value?: string;
  onSelect: (locationCode: string) => void;
  placeholder?: string;
  showHierarchy?: boolean;
  filterByUserAccess?: boolean;
  className?: string;
  disabled?: boolean;
}

const LocationItemRenderer = React.memo<{
  index: number;
  style: React.CSSProperties;
  data: {
    items: LocationItem[];
    onSelect: (code: string) => void;
    selectedValue?: string;
    showHierarchy: boolean;
  };
}>(({ index, style, data }) => {
  const item = data.items[index];
  const isSelected = data.selectedValue === item.code;
  
  return (
    <div
      style={style}
      className={`flex items-center px-3 py-2 cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-primary text-primary-foreground' 
          : 'hover:bg-muted'
      }`}
      onClick={() => data.onSelect(item.code)}
    >
      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{item.name}</div>
        {data.showHierarchy && item.fullPath !== item.name && (
          <div className="text-xs text-muted-foreground truncate">
            {item.fullPath}
          </div>
        )}
      </div>
      {item.depth > 0 && (
        <div className="text-xs bg-muted px-1 rounded ml-2">
          L{item.depth}
        </div>
      )}
    </div>
  );
});

export const VirtualizedLocationSelector: React.FC<VirtualizedLocationSelectorProps> = ({
  value,
  onSelect,
  placeholder = "Select location...",
  showHierarchy = true,
  filterByUserAccess = true,
  className = "",
  disabled = false
}) => {
  const { allLocations, getLocationByCode } = useLocationMeta();
  const { availableLocations } = useLocationState();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepth, setFilterDepth] = useState<number | null>(null);

  // Filter locations based on user access and search
  const filteredLocations = useMemo(() => {
    let locations = filterByUserAccess 
      ? allLocations.filter(loc => 
          availableLocations.some(avail => avail.value === loc.code)
        )
      : allLocations;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      locations = locations.filter(loc =>
        loc.name.toLowerCase().includes(query) ||
        loc.code.toLowerCase().includes(query) ||
        loc.fullPath.toLowerCase().includes(query)
      );
    }

    // Apply depth filter
    if (filterDepth !== null) {
      locations = locations.filter(loc => loc.depth === filterDepth);
    }

    return locations.sort((a, b) => {
      // Sort by depth first, then by name
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.name.localeCompare(b.name);
    });
  }, [allLocations, availableLocations, searchQuery, filterDepth, filterByUserAccess]);

  const selectedLocation = value ? getLocationByCode(value) : null;
  
  const handleSelect = useCallback((locationCode: string) => {
    onSelect(locationCode);
    setIsOpen(false);
    setSearchQuery("");
  }, [onSelect]);

  const availableDepths = useMemo(() => {
    const depths = new Set(allLocations.map(loc => loc.depth));
    return Array.from(depths).sort((a, b) => a - b);
  }, [allLocations]);

  // Virtual list item data
  const itemData = useMemo(() => ({
    items: filteredLocations,
    onSelect: handleSelect,
    selectedValue: value,
    showHierarchy
  }), [filteredLocations, handleSelect, value, showHierarchy]);

  const ITEM_HEIGHT = showHierarchy ? 60 : 40;
  const MAX_HEIGHT = 320;
  const listHeight = Math.min(filteredLocations.length * ITEM_HEIGHT, MAX_HEIGHT);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={`justify-between ${className}`}
          disabled={disabled}
        >
          <div className="flex items-center min-w-0 flex-1">
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">
              {selectedLocation ? selectedLocation.name : placeholder}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="start">
        {/* Search and Filters */}
        <div className="p-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          {availableDepths.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              <Button
                variant={filterDepth === null ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterDepth(null)}
              >
                All
              </Button>
              {availableDepths.map(depth => (
                <Button
                  key={depth}
                  variant={filterDepth === depth ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterDepth(depth)}
                >
                  L{depth}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="px-3 py-1 text-xs text-muted-foreground border-b">
          {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''}
        </div>

        {/* Virtualized List */}
        {filteredLocations.length > 0 ? (
          <List
            height={listHeight}
            itemCount={filteredLocations.length}
            itemSize={ITEM_HEIGHT}
            itemData={itemData}
            width="100%"
          >
            {LocationItemRenderer}
          </List>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            No locations found
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};