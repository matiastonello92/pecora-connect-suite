import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/lib/i18n';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/ui/logo';
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
} from 'lucide-react';

const navigationItems = [
  {
    title: 'dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
    roles: ['base', 'manager', 'super_admin'],
    departments: ['kitchen', 'pizzeria', 'service', 'finance', 'manager', 'super_manager'],
  },
  {
    title: 'inventory',
    url: '/inventory',
    icon: Package,
    roles: ['base', 'manager', 'super_admin'],
    departments: ['kitchen', 'pizzeria', 'service'],
  },
  {
    title: 'checklists',
    url: '/checklists',
    icon: CheckSquare,
    roles: ['base', 'manager', 'super_admin'],
    departments: ['kitchen', 'pizzeria', 'service'],
  },
  {
    title: 'communication',
    url: '/communication',
    icon: MessageSquare,
    roles: ['base', 'manager', 'super_admin'],
    departments: ['kitchen', 'pizzeria', 'service', 'finance', 'manager', 'super_manager'],
  },
  {
    title: 'cashRegister',
    url: '/cash-register',
    icon: Calculator,
    roles: ['manager', 'super_admin'],
    departments: ['manager', 'super_manager', 'finance'],
  },
  {
    title: 'reports',
    url: '/reports',
    icon: BarChart3,
    roles: ['manager', 'super_admin'],
    departments: ['manager', 'super_manager', 'finance'],
  },
  {
    title: 'equipment',
    url: '/equipment',
    icon: Wrench,
    roles: ['base', 'manager', 'super_admin'],
    departments: ['kitchen', 'pizzeria', 'service', 'manager', 'super_manager'],
  },
  {
    title: 'userManagement',
    url: '/users',
    icon: Users,
    roles: ['super_admin'],
    departments: ['super_manager'],
  },
];

export const AppSidebar = () => {
  const { user, language, hasPermission, hasAccess } = useAuth();
  const { t } = useTranslation(language);
  const { state } = useSidebar();
  const location = useLocation();
  
  const isCollapsed = state === 'collapsed';

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'bg-accent text-accent-foreground font-medium'
      : 'hover:bg-accent/50 text-foreground';

  const filteredItems = navigationItems.filter((item) => {
    if (!user) return false;
    
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
            {!isCollapsed && t('dashboard')}
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

        {/* User Info Section */}
        {!isCollapsed && user && (
          <div className="mt-auto p-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate capitalize">
                  {t(user.department)} • {user.location}
                </p>
              </div>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};