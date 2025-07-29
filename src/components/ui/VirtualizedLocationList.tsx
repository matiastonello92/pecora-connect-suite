import React, { useState, useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import { Search, MapPin, Building2, Globe, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useLocationMeta, useLocationData } from '@/context/OptimizedLocationProvider';

/**
 * VirtualizedLocationList: High-performance location browser
 * Displays hierarchical location data with lazy loading and filtering
 */

interface LocationListItem {
  id: string;
  code: string;
  name: string;
  type: 'location' | 'group';
  depth: number;
  hierarchy: Record<string, any>;
  fullPath: string;
  childCount?: number;
  hasData?: boolean;
}

interface VirtualizedLocationListProps {
  onLocationSelect?: (locationCode: string) => void;
  selectedLocation?: string;
  showDataStats?: boolean;
  className?: string;
}

const getItemSize = (index: number, itemData: any): number => {
  const item = itemData.items[index];
  const baseHeight = 48;
  const hierarchyHeight = item.hierarchy && Object.keys(item.hierarchy).length > 0 ? 20 : 0;
  const statsHeight = item.hasData ? 24 : 0;
  return baseHeight + hierarchyHeight + statsHeight;
};

const LocationListItemRenderer = React.memo<{
  index: number;
  style: React.CSSProperties;
  data: {
    items: LocationListItem[];
    onSelect?: (code: string) => void;
    selectedLocation?: string;
    showDataStats: boolean;
    locationStats: Record<string, any>;
  };
}>(({ index, style, data }) => {
  const item = data.items[index];
  const isSelected = data.selectedLocation === item.code;
  const stats = data.locationStats[item.code];
  
  const getIcon = () => {
    switch (item.depth) {
      case 0: return <Globe className="h-4 w-4" />;
      case 1: return <Building2 className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  return (
    <div
      style={style}
      className={`p-3 border-b cursor-pointer transition-colors ${
        isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
      }`}
      onClick={() => data.onSelect?.(item.code)}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className="font-medium truncate">{item.name}</h4>
            <Badge variant="outline" className="text-xs">
              {item.code}
            </Badge>
            {item.depth > 0 && (
              <Badge variant="secondary" className="text-xs">
                L{item.depth}
              </Badge>
            )}
          </div>
          
          {item.fullPath !== item.name && (
            <p className="text-sm text-muted-foreground truncate mt-1">
              {item.fullPath}
            </p>
          )}
          
          {data.showDataStats && stats && (
            <div className="flex items-center space-x-3 mt-2 text-xs text-muted-foreground">
              {stats.equipment && (
                <span className="flex items-center space-x-1">
                  <Building2 className="h-3 w-3" />
                  <span>{stats.equipment} equipment</span>
                </span>
              )}
              {stats.users && (
                <span className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{stats.users} users</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export const VirtualizedLocationList: React.FC<VirtualizedLocationListProps> = ({
  onLocationSelect,
  selectedLocation,
  showDataStats = false,
  className = ""
}) => {
  const { allLocations } = useLocationMeta();
  const { locationStats = {} } = useLocationData();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepth, setFilterDepth] = useState<number | null>(null);

  // Process and filter locations
  const filteredItems = useMemo(() => {
    let locations = [...allLocations];

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

    // Convert to list items and sort
    return locations
      .map(loc => ({
        id: loc.id,
        code: loc.code,
        name: loc.name,
        type: 'location' as const,
        depth: loc.depth,
        hierarchy: loc.hierarchy,
        fullPath: loc.fullPath,
        hasData: showDataStats && locationStats[loc.code]
      }))
      .sort((a, b) => {
        if (a.depth !== b.depth) return a.depth - b.depth;
        return a.name.localeCompare(b.name);
      });
  }, [allLocations, searchQuery, filterDepth, showDataStats, locationStats]);

  const availableDepths = useMemo(() => {
    const depths = new Set(allLocations.map(loc => loc.depth));
    return Array.from(depths).sort((a, b) => a - b);
  }, [allLocations]);

  const itemData = useMemo(() => ({
    items: filteredItems,
    onSelect: onLocationSelect,
    selectedLocation,
    showDataStats,
    locationStats
  }), [filteredItems, onLocationSelect, selectedLocation, showDataStats, locationStats]);

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {/* Search and Filters */}
        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {availableDepths.length > 1 && (
            <div className="flex gap-1 flex-wrap">
              <Badge
                variant={filterDepth === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFilterDepth(null)}
              >
                All Levels
              </Badge>
              {availableDepths.map(depth => (
                <Badge
                  key={depth}
                  variant={filterDepth === depth ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setFilterDepth(depth)}
                >
                  Level {depth}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="px-4 py-2 text-sm text-muted-foreground bg-muted/30">
          {filteredItems.length} location{filteredItems.length !== 1 ? 's' : ''} found
        </div>

        {/* Virtualized List */}
        {filteredItems.length > 0 ? (
          <List
            height={400}
            itemCount={filteredItems.length}
            itemSize={index => getItemSize(index, itemData)}
            itemData={itemData}
            width="100%"
          >
            {LocationListItemRenderer}
          </List>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No locations found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};