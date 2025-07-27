import { useSimpleAuth } from '@/context/SimpleAuthContext';
import { useTranslation, Language, languages } from '@/lib/i18n';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LocationClock } from '@/components/ui/location-clock';
import { useLocation } from '@/context/LocationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LogOut, Settings, User, Globe, Bell, MapPin } from 'lucide-react';
import { NotificationCenter, useNotificationCount } from '@/components/notifications/NotificationCenter';

export const AppHeader = () => {
  const { profile, logout } = useSimpleAuth();
  const language = 'en'; // Temporarily hardcode language
  const setLanguage = () => {}; // Temporarily disabled
  const navigate = useNavigate();
  const { t } = useTranslation(language);
  const unreadCount = useNotificationCount();
  const { activeLocation, availableLocations } = useLocation();
  
  const currentLocationName = availableLocations.find(loc => loc.value === activeLocation)?.label || activeLocation;

  const getInitials = (email: string) => {
    const name = email.split('@')[0];
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleColor = () => {
    if (!profile) return 'bg-primary text-primary-foreground';
    
    switch (profile.role) {
      case 'super_admin':
        return 'bg-destructive text-destructive-foreground';
      case 'manager':
        return 'bg-yellow-600 text-white';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };

  return (
    <header className="h-14 sm:h-16 border-b border-border bg-card flex items-center justify-between px-3 sm:px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground shrink-0" />
        
        {/* Active Location Display */}
        <Badge variant="secondary" className="flex items-center space-x-1 px-2 py-1 shrink-0">
          <MapPin className="h-3 w-3" />
          <span className="text-xs font-medium">{currentLocationName}</span>
        </Badge>
        
        <div className="hidden lg:block min-w-0">
          <p className="text-sm text-muted-foreground font-inter truncate">
            {t('welcome')}, {profile?.first_name || profile?.email?.split('@')[0] || 'User'}
          </p>
        </div>
      </div>

      {/* Center section with location clock */}
      <div className="flex-1 flex justify-center">
        <LocationClock className="bg-muted/30 px-3 py-1.5 rounded-lg border border-border/50" />
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <NotificationCenter />
          </PopoverContent>
        </Popover>

        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3">
              <Globe className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline text-sm">
                {languages[language]}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('language')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(languages) as Language[]).map((lang) => (
              <DropdownMenuItem
                key={lang}
                onClick={() => {}} // setLanguage disabled for now
                className={language === lang ? 'bg-accent' : ''}
              >
                {languages[lang]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 sm:h-10 sm:w-10 rounded-full">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarFallback className={getRoleColor()}>
                  <span className="text-xs sm:text-sm">
                    {profile && getInitials(profile.email || '')}
                  </span>
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 sm:w-56" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none truncate">
                  {profile?.first_name && profile?.last_name 
                    ? `${profile.first_name} ${profile.last_name}`
                    : profile?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {profile?.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {profile?.role || 'User'} • {(profile?.locations || []).join(', ')}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              {t('profile')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              {t('settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};