import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Edit, Save, AlertCircle } from 'lucide-react';
import { MultiLocationSelect } from '@/components/ui/location-select';
import { 
  UserProfile, 
  UserRole,
  RestaurantRole, 
  AccessLevel, 
  LocationType,
  RESTAURANT_ROLE_LABELS,
  ACCESS_LEVEL_LABELS
} from '@/types/users';
import { supabase } from '@/integrations/supabase/client';

interface UserEditDialogProps {
  user: UserProfile;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated: () => void;
}

export const UserEditDialog = ({ user, isOpen, onOpenChange, onUserUpdated }: UserEditDialogProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('base');
  const [restaurantRole, setRestaurantRole] = useState<RestaurantRole | 'none'>('none');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('base');
  const [locations, setLocations] = useState<string[]>([]);
  const [locationError, setLocationError] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
      setRole(user.role);
      setRestaurantRole(user.restaurantRole || 'none');
      setAccessLevel(user.accessLevel);
      setLocations(user.locations || [user.location].filter(Boolean)); // Use locations array or fallback to single location
      setLocationError('');
      setDepartment(user.department);
      setPosition(user.position);
    }
  }, [isOpen, user]);

  const handleSave = async () => {
    // Validate locations first
    if (locations.length === 0) {
      setLocationError('At least one location must be selected.');
      toast({
        title: "Validation Error",
        description: "At least one location must be selected.",
        variant: "destructive",
      });
      return;
    }
    setLocationError('');

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          role,
          restaurant_role: restaurantRole === 'none' ? null : restaurantRole,
          access_level: accessLevel,
          location: locations[0], // Keep single location for backward compatibility
          locations: locations,
          department,
          position,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.user_id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User profile updated successfully",
      });

      onUserUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to update user: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit User Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-2">
            <Label htmlFor="locations">Locations *</Label>
            <MultiLocationSelect
              value={locations}
              onValueChange={setLocations}
              placeholder="Select locations"
              disabled={saving}
            />
            {locationError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {locationError}
              </div>
            )}
          </div>

          {/* Restaurant Role */}
          <div className="space-y-2">
            <Label htmlFor="restaurantRole">Restaurant Role</Label>
            <Select value={restaurantRole} onValueChange={(value: RestaurantRole | 'none') => setRestaurantRole(value)} disabled={saving}>
              <SelectTrigger>
                <SelectValue placeholder="Select restaurant role (optional)" />
              </SelectTrigger>
               <SelectContent>
                 <SelectItem value="none">No specific role</SelectItem>
                 {Object.entries(RESTAURANT_ROLE_LABELS).map(([value, label]) => (
                   <SelectItem key={value} value={value}>{label}</SelectItem>
                 ))}
              </SelectContent>
            </Select>
          </div>

          {/* Access Level */}
          <div className="space-y-2">
            <Label htmlFor="accessLevel">Access Level</Label>
            <Select value={accessLevel} onValueChange={(value: AccessLevel) => setAccessLevel(value)} disabled={saving}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACCESS_LEVEL_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* System Role */}
          <div className="space-y-2">
            <Label htmlFor="systemRole">System Role</Label>
            <Select value={role} onValueChange={(value: UserRole) => setRole(value)} disabled={saving}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="base">Base User</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};