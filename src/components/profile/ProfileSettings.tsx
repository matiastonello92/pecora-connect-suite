import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Palette, Lock, Bell, MoonIcon, LogOut } from 'lucide-react';
import { UserProfile } from '@/types/users';

import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { PasswordChangeDialog } from './PasswordChangeDialog';

interface ProfileSettingsProps {
  user: UserProfile;
}

export const ProfileSettings = ({ user }: ProfileSettingsProps) => {
  const { logout } = useEnhancedAuth();
  const { toast } = useToast();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [settings, setSettings] = useState({
    theme: 'auto',
    notifications: true,
    doNotDisturb: false,
  });

  const handleThemeChange = (theme: string) => {
    setSettings(prev => ({ ...prev, theme }));
    // Theme change logic would go here
    toast({
      title: 'Theme Updated',
      description: 'Your theme preference has been updated.',
    });
  };

  const handleNotificationToggle = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, notifications: enabled }));
    toast({
      title: enabled ? 'Notifications Enabled' : 'Notifications Disabled',
    });
  };

  const handleDoNotDisturbToggle = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, doNotDisturb: enabled }));
    toast({
      title: enabled ? 'Do Not Disturb Enabled' : 'Do Not Disturb Disabled',
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Signed Out Successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while signing out.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={settings.theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications for messages and updates
              </p>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={handleNotificationToggle}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Do Not Disturb</Label>
              <p className="text-sm text-muted-foreground">
                Temporarily pause all notifications
              </p>
            </div>
            <Switch
              checked={settings.doNotDisturb}
              onCheckedChange={handleDoNotDisturbToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => setShowPasswordDialog(true)}
            className="w-full"
          >
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      <PasswordChangeDialog
        isOpen={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
      />
    </div>
  );
};