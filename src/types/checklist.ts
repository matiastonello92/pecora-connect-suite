// Checklist management types
export type ChecklistFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'as-needed';
export type ChecklistCategory = 'safety' | 'cleaning' | 'equipment' | 'inventory' | 'preparation' | 'finance' | 'quality' | 'compliance';
export type ChecklistStatus = 'draft' | 'active' | 'archived';
export type SessionStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: ChecklistCategory;
  isRequired: boolean;
  estimatedTime?: number;
  instructions?: string;
  order: number;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  department: string;
  location: string; // Add location field
  frequency: ChecklistFrequency;
  estimatedTime: number; // in minutes
  items: ChecklistItem[];
  status: ChecklistStatus;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
  isActive: boolean;
  tags?: string[];
}

export interface ChecklistSessionItem extends ChecklistItem {
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  photosRequired?: boolean;
  photos?: string[];
}

export interface ChecklistSession {
  id: string;
  templateId: string;
  template: ChecklistTemplate;
  status: SessionStatus;
  assignedTo: string;
  startedAt: Date;
  completedAt?: Date;
  items: ChecklistSessionItem[];
  overallNotes?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: Date;
}

export interface ChecklistValidation {
  sessionId: string;
  validatedBy: string;
  validatedAt: Date;
  passed: boolean;
  issues?: string[];
  recommendations?: string[];
}