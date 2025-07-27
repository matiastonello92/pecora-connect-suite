import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Calendar, MapPin, Shield, User, Hash } from 'lucide-react';
import { UserProfile } from '@/types/users';
import { useTranslation } from '@/lib/i18n';
import { format } from 'date-fns';
import { useState } from 'react';
import { EmailChangeDialog } from './EmailChangeDialog';

interface ProfileInformationProps {
  user: UserProfile;
}

export const ProfileInformation = ({ user }: ProfileInformationProps) => {
  const { t } = useTranslation('en');
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'suspended':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('profile.sections.basicInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('profile.fields.fullName')}
              </label>
              <p className="text-lg font-medium">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('profile.fields.restaurantRole')}
              </label>
              <p className="text-lg">
                {user.restaurantRole ? t(`restaurant_roles.${user.restaurantRole}`) : '-'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('profile.fields.accessLevel')}
              </label>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {t(`access_levels.${user.accessLevel}`)}
                </Badge>
                {user.hasCustomPermissions && (
                  <Badge variant="secondary" className="text-xs">+</Badge>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('profile.fields.location')}
              </label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <p className="text-lg">{t(`locations.${user.location}`)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('profile.sections.accountInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('profile.fields.email')}
              </label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="text-lg">{user.email}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEmailDialog(true)}
                >
                  {t('profile.actions.changeEmail')}
                </Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('profile.fields.status')}
              </label>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(user.status)}`} />
                <Badge variant="outline">
                  {t(`status.${user.status}`)}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('profile.fields.createdAt')}
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-lg">
                  {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('profile.fields.lastLogin')}
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-lg">
                  {user.lastLogin ? format(new Date(user.lastLogin), 'dd/MM/yyyy HH:mm') : '-'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            {t('profile.sections.systemInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              {t('profile.fields.userId')}
            </label>
            <p className="text-sm font-mono text-muted-foreground break-all">
              {user.id}
            </p>
          </div>
        </CardContent>
      </Card>

      <EmailChangeDialog
        isOpen={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        currentEmail={user.email}
      />
    </div>
  );
};