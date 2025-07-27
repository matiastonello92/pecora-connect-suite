// User management types
export type UserRole = 'base' | 'manager' | 'super_admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'intern';
export type LocationType = 'menton' | 'lyon' | 'all_locations';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  department: string;
  position: string;
  employmentType: EmploymentType;
  status: UserStatus;
  location: LocationType;
  startDate: Date;
  endDate?: Date;
  language: 'en' | 'fr' | 'it';
  permissions: string[];
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