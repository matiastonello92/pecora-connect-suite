import { useState } from 'react';
import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { useUserManagement } from '@/context/UserManagementContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Settings, Shield, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/lib/i18n';
import { ProfileInformation } from '@/components/profile/ProfileInformation';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { ProfilePictureUpload } from '@/components/profile/ProfilePictureUpload';

export const Profile = () => {
  const { profile } = useSimpleAuth();
  const { users } = useUserManagement();
  const navigate = useNavigate();
  const { t } = useTranslation('en');
  const [activeTab, setActiveTab] = useState('information');

  const currentUser = users.find(u => u.id === profile?.user_id);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">Loading...</h1>
        </div>
      </div>
    );
  }

  const initials = `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={currentUser.avatar} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <ProfilePictureUpload user={currentUser} />
            </div>
            <div>
              <h1 className="text-xl font-semibold">
                {currentUser.firstName} {currentUser.lastName}
              </h1>
              <p className="text-sm text-muted-foreground">{currentUser.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="information" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Information</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="information">
            <ProfileInformation user={currentUser} />
          </TabsContent>

          <TabsContent value="settings">
            <ProfileSettings user={currentUser} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};