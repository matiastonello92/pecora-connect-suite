// User management types
export type UserRole = 'base' | 'manager' | 'super_admin';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'intern';

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
  startDate: Date;
  endDate?: Date;
  language: 'en' | 'fr' | 'it';
  permissions: string[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Shift {
  id: string;
  userId: string;
  user: UserProfile;
  date: Date;
  startTime: string;
  endTime: string;
  department: string;
  position: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  actualStartTime?: Date;
  actualEndTime?: Date;
  breakMinutes?: number;
  notes?: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  shiftId?: string;
  clockIn: Date;
  clockOut?: Date;
  breakMinutes: number;
  totalHours?: number;
  department: string;
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
}