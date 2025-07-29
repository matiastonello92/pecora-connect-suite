import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { UserRole } from '@/types/users';
import { InvitationData, AccessLevel, LocationType } from '@/types/users';

export const InviteUserDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('base');
  const [location, setLocation] = useState<LocationType>('menton');
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
  const { toast } = useToast();

  // Only allow managers and super_admins to invite users
  if (!hasPermission('manager')) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !firstName || !lastName || !role || !location) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check for existing user with the same email
      const existingUser = await fetch(`/api/users/check-email?email=${encodeURIComponent(email)}`);
      if (existingUser.ok) {
        const userData = await existingUser.json();
        if (userData.exists) {
          toast({
            title: "Error",
            description: "A user with this email already exists",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }
    } catch (error) {
      // Continue with invitation creation if check fails
    }

    const invitationData: InvitationData = {
      email,
      firstName,
      lastName,
      role: role as UserRole,
      accessLevel: 'base' as AccessLevel,
      locations: [location]
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
      
      // Reset form
      setEmail('');
      setFirstName('');
      setLastName('');
      setRole('base');
      setLocation('menton');
      setIsOpen(false);
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite New User</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
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
            <Label htmlFor="email">Email Address</Label>
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

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Select value={location} onValueChange={(value: LocationType) => setLocation(value)} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="menton">Menton</SelectItem>
                <SelectItem value="lyon">Lyon</SelectItem>
                <SelectItem value="all_locations">All Locations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
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

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
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
                  <LoadingSpinner size="sm" />
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