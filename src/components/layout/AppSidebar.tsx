import { useEnhancedAuth } from '@/providers/EnhancedAuthProvider';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';

import { NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
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
import { NotificationBadge } from '@/components/ui/notification-badge';
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
  Activity,
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
      
      { title: 'activeLocation', url: '/settings/location', icon: Building },
      { title: 'notificationSettings', url: '/settings/notifications', icon: Bell },
      { title: 'userPreferences', url: '/settings', icon: UserCog },
    ],
  },
  {
    title: 'testDashboard',
    url: '/app/test-dashboard',
    icon: Activity,
    roles: ['manager', 'super_admin'],
    departments: ['manager', 'super_manager', 'general_manager'],
  },
];

// Simple title mapping for hardcoded English
const getTitle = (key: string): string => {
  const titles: Record<string, string> = {
    dashboard: 'Dashboard',
    overview: 'Overview',
    reports: 'Reports',
    recentActivity: 'Recent Activity',
    inventories: 'Inventories',
    kitchenInventory: 'Kitchen Inventory',
    pizzeriaInventory: 'Pizzeria Inventory',
    salaBarInventory: 'Sala Bar Inventory',
    equipmentInventory: 'Equipment Inventory',
    suppliers: 'Suppliers',
    sentOrders: 'Sent Orders',
    createNewOrder: 'Create New Order',
    orderHistory: 'Order History',
    chat: 'Communication',
    checklists: 'Checklists',
    miseEnPlace: 'Mise en Place',
    serviceChecklists: 'Service Checklists',
    completedChecklists: 'Completed Checklists',
    tasks: 'Tasks',
    dailyTasks: 'Daily Tasks',
    assignedTasks: 'Assigned Tasks',
    completedTasks: 'Completed Tasks',
    finance: 'Finance',
    cashRegisterClosure: 'Cash Register Closure',
    financialReports: 'Financial Reports',
    cashHistory: 'Cash History',
    users: 'Users',
    userManagement: 'User Management',
    invitations: 'Invitations',
    rolesPermissions: 'Roles & Permissions',
    maintenance: 'Maintenance',
    techniciansList: 'Technicians List',
    scheduledInterventions: 'Scheduled Interventions',
    faultReports: 'Fault Reports',
    settings: 'Settings',
    
    activeLocation: 'Active Location',
    notificationSettings: 'Notification Settings',
    userPreferences: 'User Preferences',
    testDashboard: 'Test Dashboard',
    navigation: 'Navigation',
  };
  return titles[key] || key;
};

export const AppSidebar = () => {
  const { profile, logout } = useEnhancedAuth();
  const hasPermission = () => true; // Temporarily allow all permissions
  const hasAccess = () => true; // Temporarily allow all access
  const { totalUnreadCount, markChatAsRead } = useUnreadMessages();
  const { state, setOpen } = useSidebar();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const isCollapsed = state === 'collapsed';

  // Initialize openGroups based on current route
  const initializeOpenGroups = () => {
    const initialState: Record<string, boolean> = {};
    navigationItems.forEach(item => {
      if (item.submenu) {
        // Check if any submenu item matches current route
        const hasActiveSubmenu = item.submenu.some((subItem: any) => 
          location.pathname === subItem.url || location.pathname.startsWith(subItem.url + '/')
        );
        initialState[item.title] = hasActiveSubmenu;
      }
    });
    return initialState;
  };

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initializeOpenGroups);

  // Update openGroups when route changes
  useEffect(() => {
    setOpenGroups(initializeOpenGroups());
  }, [location.pathname]);

  // Auto-close sidebar on navigation for mobile devices
  useEffect(() => {
    if (isMobile && location.pathname) {
      // Small delay to allow navigation animation to complete
      const timer = setTimeout(() => {
        setOpen(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, isMobile, setOpen]);

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? 'bg-accent text-accent-foreground font-medium'
      : 'hover:bg-accent/50 focus:bg-accent/50 active:bg-accent/50 text-foreground transition-colors';

  const getParentNavClassName = (item: any) => {
    // Parent should only be highlighted if it's a direct link (no submenu)
    if (item.url && !item.submenu) {
      return location.pathname === item.url
        ? 'bg-accent text-accent-foreground font-medium'
        : 'hover:bg-accent/50 focus:bg-accent/50 active:bg-accent/50 transition-colors';
    }
    // For expandable items, show muted highlight when group contains active item
    const hasActiveSubmenu = item.submenu?.some((subItem: any) => 
      location.pathname === subItem.url || location.pathname.startsWith(subItem.url + '/')
    );
    return hasActiveSubmenu
      ? 'bg-accent/30 text-accent-foreground hover:bg-accent/50 focus:bg-accent/50 active:bg-accent/50 transition-colors'
      : 'hover:bg-accent/50 focus:bg-accent/50 active:bg-accent/50 transition-colors';
  };

  const isSubmenuItemActive = (subItemUrl: string) => {
    return location.pathname === subItemUrl || location.pathname.startsWith(subItemUrl + '/');
  };

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupTitle]: !prev[groupTitle]
    }));
  };

  const filteredItems = navigationItems.filter((item) => {
    if (!profile) return false;
    
    // All authenticated users can see everything
    return true;
    
    const hasRolePermission = true; // Allow all for now
    const hasDepartmentAccess = true; // Allow all for now
    
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
          <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold text-muted-foreground tracking-wider">
            {!isCollapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {/* Single page items (like Chat) */}
                  {item.url && !item.submenu ? (
                    <div className="relative">
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          className={getNavClassName}
                          title={isCollapsed ? getTitle(item.title) : undefined}
                          onClick={() => {
                            // Mark chat as read when clicking on chat link
                            if (item.title === 'chat' && totalUnreadCount > 0) {
                              // This will be handled by the chat context when user enters chat
                            }
                          }}
                        >
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          {!isCollapsed && (
                            <span className="ml-3 font-inter">
                              {getTitle(item.title)}
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                      {/* Show notification badge for chat */}
                      {item.title === 'chat' && (
                        <NotificationBadge 
                          count={totalUnreadCount}
                          size={isCollapsed ? 'sm' : 'md'}
                          className={isCollapsed ? '-top-1 -right-1' : 'top-1 right-2'}
                        />
                      )}
                    </div>
                  ) : (
                    /* Expandable sections */
                    <>
                      <SidebarMenuButton
                        onClick={() => toggleGroup(item.title)}
                        className={getParentNavClassName(item)}
                        title={isCollapsed ? getTitle(item.title) : undefined}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && (
                          <>
                            <span className="ml-3 font-inter flex-1">
                              {getTitle(item.title)}
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
                                  className={({ isActive }) => 
                                    isSubmenuItemActive(subItem.url) || isActive
                                      ? 'bg-accent text-accent-foreground font-medium'
                                      : 'hover:bg-accent/50 focus:bg-accent/50 active:bg-accent/50 text-muted-foreground transition-colors'
                                  }
                                >
                                  <subItem.icon className="h-4 w-4 flex-shrink-0" />
                                  <span className="ml-2 font-inter text-sm">
                                    {getTitle(subItem.title)}
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
          {!isCollapsed && profile && (
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {profile.firstName && profile.lastName 
                      ? `${profile.firstName} ${profile.lastName}`
                      : profile.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate capitalize">
                    {profile.status || 'Active'} • {(profile.locations || []).join(', ')}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <SidebarMenuButton asChild className="flex-1">
                  <NavLink to="/settings" className={getNavClassName}>
                    <Settings className="h-4 w-4" />
                    <span className="ml-2 text-xs">Settings</span>
                  </NavLink>
                </SidebarMenuButton>
                
                <SidebarMenuButton 
                  onClick={logout}
                  className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 focus:bg-destructive/10 active:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="ml-2 text-xs">Sign Out</span>
                </SidebarMenuButton>
              </div>
            </div>
          )}
          
          {isCollapsed && (
            <div className="p-2 space-y-1">
              <SidebarMenuButton asChild>
                <NavLink to="/settings" title="Settings">
                  <Settings className="h-4 w-4" />
                </NavLink>
              </SidebarMenuButton>
              
              <SidebarMenuButton 
                onClick={logout}
                title="Sign Out"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 focus:bg-destructive/10 active:bg-destructive/10 transition-colors"
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