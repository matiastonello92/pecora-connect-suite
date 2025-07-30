// Simplified user management types after permission system removal

export type UserStatus = 'active' | 'inactive' | 'suspended';

// Simplified user profile interface - only essential data
export interface UserProfile {
  user_id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar_url?: string;
  status: UserStatus;
  locations: string[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Simplified archived user interface
export interface ArchivedUser {
  id: string;
  originalUserId?: string;
  originalInvitationId?: string;
  firstName: string;
  lastName: string;
  email: string;
  locations: string[];
  previousStatus: 'active' | 'pending';
  archivedBy?: string;
  archivedAt: Date;
  reason?: string;
  metadata?: any;
  canReactivate: boolean;
}

// Simplified invitation data interface
export interface InvitationData {
  email: string;
  firstName: string;
  lastName: string;
  locations: string[];
}