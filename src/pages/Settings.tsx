import React from 'react';
import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { User, Shield, Palette, Bell } from 'lucide-react';

export const Settings = () => {
  const { user } = useEnhancedAuth();
  const updateUser = (user: any) => {}; // Temporarily stub

  const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (user) {
      updateUser({
        ...user,
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        email: formData.get('email') as string,
      });
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  defaultValue={user.user_metadata?.firstName || ''}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  defaultValue={user.user_metadata?.lastName || ''}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={user.email}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value="Kitchen" disabled />
              </div>
              
              <Button type="submit" className="w-full">
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>


        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={user.user_metadata?.role || 'User'} disabled />
              </div>
              
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value="Menton" disabled />
              </div>
              
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Toggle
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive system notifications
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;