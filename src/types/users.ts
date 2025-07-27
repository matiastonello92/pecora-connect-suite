// User management types
export type UserRole = 'base' | 'manager' | 'super_admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'intern';
export type LocationType = 'menton' | 'lyon' | 'all_locations';

// Restaurant roles (descriptive job functions)
export type RestaurantRole = 
  | 'waiter'
  | 'runner'
  | 'bartender'
  | 'floor_manager'
  | 'location_director'
  | 'general_director'
  | 'cook'
  | 'kitchen_assistant'
  | 'pizza_chef'
  | 'dishwasher'
  | 'stock_manager'
  | 'cleaning_staff'
  | 'accountant'
  | 'procurement_manager'
  | 'social_media_manager'
  | 'maintenance_manager'
  | 'human_resources';

// Access levels (define actual app permissions)
export type AccessLevel = 
  | 'base'
  | 'manager_sala'
  | 'manager_cucina'
  | 'general_manager'
  | 'assistant_manager'
  | 'financial_department'
  | 'communication_department'
  | 'observer';

// App modules for permission system
export type AppModule = 
  | 'chat'
  | 'inventory_sala'
  | 'inventory_kitchen'
  | 'checklists'
  | 'suppliers'
  | 'equipment'
  | 'financial'
  | 'cash_closure'
  | 'reports'
  | 'tasks'
  | 'communication'
  | 'announcements'
  | 'user_management';

// Permission types
export interface ModulePermissions {
  can_read: boolean;
  can_write: boolean;
  can_validate: boolean;
  can_delete: boolean;
}

export interface UserPermission {
  id: string;
  user_id: string;
  module: AppModule;
  can_read: boolean;
  can_write: boolean;
  can_validate: boolean;
  can_delete: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  restaurantRole?: RestaurantRole;
  accessLevel: AccessLevel;
  hasCustomPermissions: boolean;
  department: string;
  position: string;
  employmentType: EmploymentType;
  status: UserStatus;
  location: LocationType; // Keep for backward compatibility
  locations: string[]; // New multiple locations field
  startDate: Date;
  endDate?: Date;
  language: 'en' | 'fr' | 'it';
  permissions: string[];
  customPermissions?: UserPermission[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}


export interface ArchivedUser {
  id: string;
  originalUserId?: string;
  originalInvitationId?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  restaurantRole?: RestaurantRole;
  accessLevel?: AccessLevel;
  location: LocationType;
  department?: string;
  position?: string;
  previousStatus: 'active' | 'pending';
  archivedBy?: string;
  archivedAt: Date;
  reason?: string;
  metadata?: any;
  canReactivate: boolean;
}

// Helper interfaces for forms and invitations
export interface InvitationData {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  restaurantRole?: RestaurantRole;
  accessLevel: AccessLevel;
  location: LocationType;
  customPermissions?: Partial<Record<AppModule, ModulePermissions>>;
}

// Constants for UI display
export const RESTAURANT_ROLE_LABELS: Record<RestaurantRole, string> = {
  waiter: 'Waiter',
  runner: 'Runner',
  bartender: 'Bartender',
  floor_manager: 'Floor Manager',
  location_director: 'Location Director',
  general_director: 'General Director',
  cook: 'Cook',
  kitchen_assistant: 'Kitchen Assistant',
  pizza_chef: 'Pizza Chef',
  dishwasher: 'Dishwasher',
  stock_manager: 'Stock Manager',
  cleaning_staff: 'Cleaning Staff',
  accountant: 'Accountant',
  procurement_manager: 'Procurement Manager',
  social_media_manager: 'Social Media Manager',
  maintenance_manager: 'Maintenance Manager',
  human_resources: 'Human Resources'
};

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  base: 'Base User',
  manager_sala: 'Manager Sala',
  manager_cucina: 'Manager Cucina',
  general_manager: 'General Manager',
  assistant_manager: 'Assistant Manager',
  financial_department: 'Financial Department',
  communication_department: 'Communication Department',
  observer: 'Observer'
};

export const MODULE_LABELS: Record<AppModule, string> = {
  chat: 'Internal Chat',
  inventory_sala: 'Sala Inventory',
  inventory_kitchen: 'Kitchen Inventory',
  checklists: 'Checklists',
  suppliers: 'Suppliers',
  equipment: 'Equipment',
  financial: 'Financial',
  cash_closure: 'Cash Closure',
  reports: 'Reports',
  tasks: 'Tasks',
  communication: 'Communication',
  announcements: 'Announcements',
  user_management: 'User Management'
};