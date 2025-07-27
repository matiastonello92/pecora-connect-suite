import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Globe, Palette, Lock, Bell, MoonIcon, LogOut } from 'lucide-react';
import { UserProfile } from '@/types/users';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PasswordChangeDialog } from './PasswordChangeDialog';

interface ProfileSettingsProps {
  user: UserProfile;
}

export const ProfileSettings = ({ user }: ProfileSettingsProps) => {
  const { t, i18n } = useTranslation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [settings, setSettings] = useState({
    language: i18n.language,
    theme: 'auto',
    notifications: true,
    doNotDisturb: false,
  });

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
    setSettings(prev => ({ ...prev, language }));
    toast({
      title: t('profile.messages.languageChanged'),
      description: t('profile.messages.languageChangedDesc'),
    });
  };

  const handleThemeChange = (theme: string) => {
    setSettings(prev => ({ ...prev, theme }));
    // Theme change logic would go here
    toast({
      title: t('profile.messages.themeChanged'),
      description: t('profile.messages.themeChangedDesc'),
    });
  };

  const handleNotificationToggle = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, notifications: enabled }));
    toast({
      title: enabled ? t('profile.messages.notificationsEnabled') : t('profile.messages.notificationsDisabled'),
    });
  };

  const handleDoNotDisturbToggle = (enabled: boolean) => {
    setSettings(prev => ({ ...prev, doNotDisturb: enabled }));
    toast({
      title: enabled ? t('profile.messages.dndEnabled') : t('profile.messages.dndDisabled'),
    });
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: t('profile.messages.loggedOut'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('profile.messages.logoutError'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('profile.sections.language')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>{t('profile.fields.interfaceLanguage')}</Label>
            <Select value={settings.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="it">Italiano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t('profile.sections.appearance')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>{t('profile.fields.theme')}</Label>
            <Select value={settings.theme} onValueChange={handleThemeChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t('profile.theme.light')}</SelectItem>
                <SelectItem value="dark">{t('profile.theme.dark')}</SelectItem>
                <SelectItem value="auto">{t('profile.theme.auto')}</SelectItem>
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
            {t('profile.sections.notifications')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('profile.fields.pushNotifications')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('profile.descriptions.pushNotifications')}
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
              <Label>{t('profile.fields.doNotDisturb')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('profile.descriptions.doNotDisturb')}
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
            {t('profile.sections.security')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={() => setShowPasswordDialog(true)}
            className="w-full"
          >
            {t('profile.actions.changePassword')}
          </Button>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('profile.sections.accountActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t('profile.actions.logout')}
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