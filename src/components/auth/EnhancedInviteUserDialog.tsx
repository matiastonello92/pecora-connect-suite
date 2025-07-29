import { useState } from 'react';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { UserRole } from '@/types/users';
import { useUserManagement } from '@/context/UserManagementContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

import { Loader2, UserPlus, ChevronDown, ChevronRight, Settings, AlertCircle } from 'lucide-react';
import { MultiLocationSelect } from '@/components/ui/location-select';
import { 
  LocationType, 
  RestaurantRole, 
  AccessLevel, 
  AppModule,
  InvitationData,
  RESTAURANT_ROLE_LABELS,
  ACCESS_LEVEL_LABELS,
  MODULE_LABELS,
  ModulePermissions
} from '@/types/users';

export const EnhancedInviteUserDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('base');
  const [restaurantRole, setRestaurantRole] = useState<RestaurantRole | 'none'>('none');
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('base');
  const [locations, setLocations] = useState<string[]>([]);
  const [locationError, setLocationError] = useState('');
  const [hasCustomPermissions, setHasCustomPermissions] = useState(false);
  const [customPermissions, setCustomPermissions] = useState<Partial<Record<AppModule, ModulePermissions>>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useSimpleAuth();
  
  
  // Temporary permission check - replace with proper permission system
  const hasPermission = (permission: string) => {
    return user?.user_metadata?.role === 'manager' || user?.user_metadata?.role === 'super_admin';
  };
  
  // Temporary invitation creation - replace with proper service
  const createInvitation = async (data: InvitationData) => {
    console.log('Creating invitation:', data);
    return { error: null };
  };
  const { users, pendingInvitations, refreshData } = useUserManagement();
  const { toast } = useToast();
  

  // Only allow managers and super_admins to invite users
  if (!hasPermission('manager')) {
    return null;
  }

  const modules: AppModule[] = [
    'chat', 'inventory_sala', 'inventory_kitchen', 'checklists', 
    'suppliers', 'equipment', 'financial', 'cash_closure', 
    'reports', 'tasks', 'communication', 'announcements', 'user_management'
  ];

  const handlePermissionChange = (module: AppModule, permission: keyof ModulePermissions, checked: boolean) => {
    setCustomPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [permission]: checked
      }
    }));
  };

  const resetForm = () => {
    setEmail('');
    setFirstName('');
    setLastName('');
    setRole('base');
    setRestaurantRole('none');
    setAccessLevel('base');
    setLocations([]);
    setLocationError('');
    setHasCustomPermissions(false);
    setCustomPermissions({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    if (!email || !firstName || !lastName || !role || !accessLevel) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check for existing user with the same email
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      toast({
        title: "Error",
        description: "A user with this email already exists",
        variant: "destructive",
      });
      return;
    }

    // Check for existing pending invitation
    const existingInvitation = pendingInvitations.find(i => i.email.toLowerCase() === email.toLowerCase());
    if (existingInvitation) {
      toast({
        title: "Error",
        description: "An invitation has already been sent to this email",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const invitationData: InvitationData = {
        email,
        firstName,
        lastName,
        role: role as UserRole,
        restaurantRole: restaurantRole === 'none' ? undefined : restaurantRole as RestaurantRole,
        accessLevel: accessLevel as AccessLevel,
        location: locations[0] as LocationType, // Use first location for backward compatibility
        locations: locations,
        customPermissions: hasCustomPermissions ? customPermissions : undefined
      };

      const result = await createInvitation(invitationData);
      
      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Invitation sent to ${email}`,
        });
        
        resetForm();
        setIsOpen(false);
        
        // Refresh the user management data
        refreshData();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to send invitation: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@pecoranegra.fr"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          {/* Role Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Role Assignment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locations">Locations *</Label>
                <MultiLocationSelect
                  value={locations}
                  onValueChange={setLocations}
                  placeholder="Select locations"
                  disabled={isLoading}
                />
                {locationError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {locationError}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">System Role *</Label>
                <Select value={role} onValueChange={(value: UserRole) => setRole(value)} disabled={isLoading}>
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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="restaurantRole">Restaurant Role</Label>
                <Select value={restaurantRole} onValueChange={(value: RestaurantRole | 'none') => setRestaurantRole(value)} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select restaurant role (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific role</SelectItem>
                    {Object.entries(RESTAURANT_ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accessLevel">Access Level *</Label>
                <Select value={accessLevel} onValueChange={(value: AccessLevel) => setAccessLevel(value)} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACCESS_LEVEL_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Custom Permissions */}
          <div className="space-y-4">
            <Collapsible open={hasCustomPermissions} onOpenChange={setHasCustomPermissions}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between"
                  disabled={isLoading}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Custom Permissions (Advanced)
                  </div>
                  {hasCustomPermissions ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Custom permissions override the default access level. Only set permissions that differ from the default.
                  </p>
                </div>
                
                <div className="grid gap-4">
                  {modules.map((module) => (
                    <div key={module} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">
                        {MODULE_LABELS[module]}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(['can_read', 'can_write', 'can_validate', 'can_delete'] as const).map((permission) => (
                          <div key={permission} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${module}-${permission}`}
                              checked={customPermissions[module]?.[permission] || false}
                              onCheckedChange={(checked) => 
                                handlePermissionChange(module, permission, checked as boolean)
                              }
                              disabled={isLoading}
                            />
                            <Label 
                              htmlFor={`${module}-${permission}`} 
                              className="text-sm font-normal"
                            >
                              {permission.replace('can_', '').replace('_', ' ')}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setIsOpen(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};