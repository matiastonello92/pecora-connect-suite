import React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useActiveLocations, Location } from '@/hooks/useLocations';

interface MultiLocationSelectProps {
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const MultiLocationSelect: React.FC<MultiLocationSelectProps> = ({
  value,
  onValueChange,
  placeholder = "Select locations...",
  className,
  disabled = false
}) => {
  const { data: locations = [], isLoading } = useActiveLocations();
  const [open, setOpen] = React.useState(false);

  const selectedLocations = locations.filter(location => value.includes(location.code));

  const toggleLocation = (locationCode: string) => {
    const isSelected = value.includes(locationCode);
    if (isSelected) {
      onValueChange(value.filter(code => code !== locationCode));
    } else {
      onValueChange([...value, locationCode]);
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" className={className} disabled>
        Loading locations...
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1">
            {selectedLocations.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : selectedLocations.length === 1 ? (
              selectedLocations[0].name
            ) : (
              <>
                <Badge variant="secondary" className="text-xs">
                  {selectedLocations.length} locations
                </Badge>
              </>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search locations..." />
          <CommandEmpty>No locations found.</CommandEmpty>
          <CommandGroup>
            {locations.map((location) => (
              <CommandItem
                key={location.code}
                value={location.code}
                onSelect={() => toggleLocation(location.code)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value.includes(location.code) ? "opacity-100" : "opacity-0"
                  )}
                />
                {location.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

interface SingleLocationSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowedLocations?: string[]; // If provided, only show these locations
}

export const SingleLocationSelect: React.FC<SingleLocationSelectProps> = ({
  value,
  onValueChange,
  placeholder = "Select location...",
  className,
  disabled = false,
  allowedLocations
}) => {
  const { data: allLocations = [], isLoading } = useActiveLocations();
  const [open, setOpen] = React.useState(false);

  const locations = allowedLocations 
    ? allLocations.filter(loc => allowedLocations.includes(loc.code))
    : allLocations;

  const selectedLocation = locations.find(location => location.code === value);

  if (isLoading) {
    return (
      <Button variant="outline" className={className} disabled>
        Loading locations...
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          disabled={disabled}
        >
          {selectedLocation ? selectedLocation.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search locations..." />
          <CommandEmpty>No locations found.</CommandEmpty>
          <CommandGroup>
            {locations.map((location) => (
              <CommandItem
                key={location.code}
                value={location.code}
                onSelect={() => {
                  onValueChange(location.code);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === location.code ? "opacity-100" : "opacity-0"
                  )}
                />
                {location.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};