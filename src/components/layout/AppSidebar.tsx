import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/ui/logo';
import { LocationSwitcher } from './LocationSwitcher';
import {
  LayoutDashboard,
  Package,
  CheckSquare,
  MessageSquare,
  Calculator,
  BarChart3,
  Wrench,
  Users,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  Truck,
  ClipboardList,
  DollarSign,
  Shield,
  AlertTriangle,
  ListTodo,
  ShoppingCart,
  FileText,
  TrendingUp,
  Download,
  UserCog,
  Bell,
  Building,
  Headphones,
} from 'lucide-react';

const navigationItems = [
  {
    title: 'chat',
    url: '/communication',
    icon: MessageSquare,
    roles: ['base', 'manager', 'director', 'finance', 'super_admin'],
    departments: ['kitchen', 'pizzeria', 'service', 'finance', 'manager', 'super_manager', 'general_manager'],
  },
];

export const AppSidebar = () => {
  const { user, language, hasPermission, hasAccess, logout } = useAuth();
  const { t } = useTranslation(language);
  const { state } = useSidebar();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  
  const isCollapsed = state === 'collapsed';

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'bg-accent text-accent-foreground font-medium'
      : 'hover:bg-accent/50 text-foreground';

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }));
  };

  const isGroupActive = (item: any) => {
    return item.url && location.pathname === item.url;
  };

  const filteredItems = navigationItems.filter((item) => {
    if (!user) return false;
    
    // Super admin can see everything
    if (user.role === 'super_admin') return true;
    
    const hasRolePermission = item.roles.some(role => hasPermission(role as any));
    const hasDepartmentAccess = hasAccess(item.departments as any);
    
    return hasRolePermission && hasDepartmentAccess;
  });

  return (
    <Sidebar className={isCollapsed ? 'w-18' : 'w-64'} collapsible="icon">
      <SidebarContent>
        {/* Logo Section */}
        <div className="p-4 border-b border-border">
          {isCollapsed ? (
            <Logo showText={false} size="sm" className="justify-center" />
          ) : (
            <Logo size="sm" />
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {!isCollapsed && t('navigation')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={getNavClassName}
                      title={isCollapsed ? t(item.title) : undefined}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && (
                        <span className="ml-3 font-inter">
                          {t(item.title)}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Location Switcher */}
        <LocationSwitcher />

        {/* User Footer Section */}
        <div className="mt-auto border-t border-border">
          {!isCollapsed && user && (
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate capitalize">
                    {t(user.department)} • {user.location}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <SidebarMenuButton asChild className="flex-1">
                  <NavLink to="/settings" className={getNavClassName}>
                    <Settings className="h-4 w-4" />
                    <span className="ml-2 text-xs">{t('settings')}</span>
                  </NavLink>
                </SidebarMenuButton>
                
                <SidebarMenuButton 
                  onClick={logout}
                  className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="ml-2 text-xs">{t('logout')}</span>
                </SidebarMenuButton>
              </div>
            </div>
          )}
          
          {isCollapsed && (
            <div className="p-2 space-y-1">
              <SidebarMenuButton asChild>
                <NavLink to="/settings" title={t('settings')}>
                  <Settings className="h-4 w-4" />
                </NavLink>
              </SidebarMenuButton>
              
              <SidebarMenuButton 
                onClick={logout}
                title={t('logout')}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
              </SidebarMenuButton>
            </div>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
};