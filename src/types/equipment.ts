// Equipment management types
export type EquipmentStatus = 'operational' | 'maintenance' | 'broken' | 'retired';
export type MaintenanceType = 'routine' | 'repair' | 'deep-clean' | 'inspection';
export type EquipmentCategory = 'kitchen' | 'bar' | 'cleaning' | 'pos' | 'hvac' | 'furniture';

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  model?: string;
  serialNumber?: string;
  purchaseDate: Date;
  warrantyExpiry?: Date;
  location: string;
  department: string;
  status: EquipmentStatus;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  notes?: string;
  manualUrl?: string;
  images?: string[];
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  type: MaintenanceType;
  description: string;
  performedBy: string;
  performedAt: Date;
  cost?: number;
  duration: number;
  nextMaintenanceDate?: Date;
  partsUsed?: Array<{
    name: string;
    quantity: number;
    cost: number;
  }>;
  notes?: string;
}

export interface MaintenanceSchedule {
  id: string;
  equipmentId: string;
  equipment: Equipment;
  type: MaintenanceType;
  frequency: number; // days
  lastPerformed?: Date;
  nextDue: Date;
  isOverdue: boolean;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high';
}