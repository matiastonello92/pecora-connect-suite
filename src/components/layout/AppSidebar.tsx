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
  Plus,
  Globe,
} from 'lucide-react';

const navigationItems = [
  {
    title: 'dashboard',
    icon: LayoutDashboard,
    roles: ['base', 'manager', 'director', 'finance', 'super_admin'],
    departments: ['kitchen', 'pizzeria', 'service', 'finance', 'manager', 'super_manager', 'general_manager'],
    submenu: [
      { title: 'overview', url: '/dashboard', icon: LayoutDashboard },
      { title: 'reports', url: '/reports', icon: BarChart3 },
      { title: 'recentActivity', url: '/dashboard/activity', icon: Bell },
    ],
  },
  {
    title: 'inventories',
    icon: Package,
    roles: ['base', 'manager', 'director', 'super_admin'],
    departments: ['kitchen', 'pizzeria', 'service', 'manager', 'super_manager', 'general_manager'],
    submenu: [
      { title: 'kitchenInventory', url: '/inventory/kitchen', icon: Package },
      { title: 'pizzeriaInventory', url: '/inventory/pizzeria', icon: Package },
      { title: 'salaBarInventory', url: '/inventory/service', icon: Package },
      { title: 'equipmentInventory', url: '/equipment', icon: Wrench },
    ],
  },
  {
    title: 'suppliers',
    icon: Truck,
    roles: ['manager', 'director', 'super_admin'],
    departments: ['manager', 'super_manager', 'finance', 'general_manager'],
    submenu: [
      { title: 'sentOrders', url: '/suppliers/orders', icon: ShoppingCart },
      { title: 'createNewOrder', url: '/suppliers/new', icon: Plus },
      { title: 'orderHistory', url: '/suppliers/history', icon: FileText },
    ],
  },
  {
    title: 'chat',
    url: '/communication',
    icon: MessageSquare,
    roles: ['base', 'manager', 'director', 'finance', 'super_admin'],
    departments: ['kitchen', 'pizzeria', 'service', 'finance', 'manager', 'super_manager', 'general_manager'],
  },
  {
    title: 'checklists',
    icon: CheckSquare,
    roles: ['base', 'manager', 'director', 'super_admin'],
    departments: ['kitchen', 'pizzeria', 'service', 'manager', 'super_manager', 'general_manager'],
    submenu: [
      { title: 'miseEnPlace', url: '/checklists/mise-en-place', icon: ClipboardList },
      { title: 'serviceChecklists', url: '/checklists', icon: CheckSquare },
      { title: 'completedChecklists', url: '/checklists/completed', icon: BarChart3 },
    ],
  },
  {
    title: 'tasks',
    icon: ListTodo,
    roles: ['base', 'manager', 'director', 'super_admin'],
    departments: ['kitchen', 'pizzeria', 'service', 'finance', 'manager', 'super_manager', 'general_manager'],
    submenu: [
      { title: 'dailyTasks', url: '/tasks', icon: ListTodo },
      { title: 'assignedTasks', url: '/tasks/assigned', icon: CheckSquare },
      { title: 'completedTasks', url: '/tasks/completed', icon: BarChart3 },
    ],
  },
  {
    title: 'finance',
    icon: DollarSign,
    roles: ['manager', 'director', 'finance', 'super_admin'],
    departments: ['finance', 'manager', 'super_manager', 'general_manager'],
    submenu: [
      { title: 'cashRegisterClosure', url: '/financial', icon: Calculator },
      { title: 'financialReports', url: '/financial?tab=reports', icon: BarChart3 },
      { title: 'cashHistory', url: '/financial/history', icon: TrendingUp },
    ],
  },
  {
    title: 'users',
    icon: Users,
    roles: ['manager', 'admin', 'super_admin'],
    departments: ['super_manager', 'general_manager'],
    submenu: [
      { title: 'userManagement', url: '/users', icon: UserCog },
      { title: 'invitations', url: '/users/invitations', icon: Bell },
      { title: 'rolesPermissions', url: '/users/roles', icon: Shield },
    ],
  },
  {
    title: 'maintenance',
    icon: Wrench,
    roles: ['base', 'manager', 'director', 'super_admin'],
    departments: ['kitchen', 'pizzeria', 'service', 'manager', 'super_manager', 'general_manager'],
    submenu: [
      { title: 'techniciansList', url: '/maintenance/technicians', icon: Users },
      { title: 'scheduledInterventions', url: '/maintenance/scheduled', icon: Settings },
      { title: 'faultReports', url: '/maintenance', icon: AlertTriangle },
    ],
  },
  {
    title: 'settings',
    icon: Settings,
    roles: ['base', 'manager', 'director', 'finance', 'super_admin'],
    departments: ['kitchen', 'pizzeria', 'service', 'finance', 'manager', 'super_manager', 'general_manager'],
    submenu: [
      { title: 'language', url: '/settings/language', icon: Globe },
      { title: 'activeLocation', url: '/settings/location', icon: Building },
      { title: 'notificationSettings', url: '/settings/notifications', icon: Bell },
      { title: 'userPreferences', url: '/settings', icon: UserCog },
    ],
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
    if (item.url) return location.pathname === item.url;
    if (item.submenu) {
      return item.submenu.some((subItem: any) => location.pathname === subItem.url);
    }
    return false;
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
                  {/* Single page items (like Chat) */}
                  {item.url && !item.submenu ? (
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
                  ) : (
                    /* Expandable sections */
                    <>
                      <SidebarMenuButton
                        onClick={() => toggleGroup(item.title)}
                        className={`${isGroupActive(item) ? 'bg-accent text-accent-foreground font-medium' : 'hover:bg-accent/50'}`}
                        title={isCollapsed ? t(item.title) : undefined}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && (
                          <>
                            <span className="ml-3 font-inter flex-1">
                              {t(item.title)}
                            </span>
                            {openGroups[item.title] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </>
                        )}
                      </SidebarMenuButton>
                      
                      {/* Submenu */}
                      {openGroups[item.title] && !isCollapsed && item.submenu && (
                        <SidebarMenuSub>
                          {item.submenu.map((subItem: any) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <NavLink
                                  to={subItem.url}
                                  className={getNavClassName}
                                >
                                  <subItem.icon className="h-4 w-4 flex-shrink-0" />
                                  <span className="ml-2 font-inter text-sm">
                                    {t(subItem.title)}
                                  </span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      )}
                    </>
                  )}
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