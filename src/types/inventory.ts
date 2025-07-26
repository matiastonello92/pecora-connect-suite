// Inventory management types
export type InventoryCategory = 'vegetables' | 'meat' | 'dairy' | 'dry-goods' | 'beverages' | 'wine' | 'cleaning' | 'other';
export type InventoryUnit = 'kg' | 'g' | 'l' | 'ml' | 'piece' | 'bottle' | 'can' | 'box';
export type SessionStatus = 'active' | 'completed' | 'cancelled';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  unit: InventoryUnit;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitCost: number;
  supplier: string;
  location: string;
  department: string;
  expiryDate?: Date;
  batchNumber?: string;
  barcode?: string;
  lastUpdated: Date;
  updatedBy: string;
  notes?: string;
}

export interface InventorySessionItem {
  itemId: string;
  item: InventoryItem;
  expectedQuantity: number;
  countedQuantity: number;
  variance: number;
  notes?: string;
}

export interface InventorySession {
  id: string;
  department: string;
  status: SessionStatus;
  items: InventorySessionItem[];
  startedBy: string;
  startedAt: Date;
  completedBy?: string;
  completedAt?: Date;
  notes?: string;
}

export interface InvoiceItem {
  itemId: string;
  name: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  expiryDate?: Date;
  batchNumber?: string;
}

export interface Invoice {
  id: string;
  supplier: string;
  invoiceNumber: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  receivedAt: Date;
  processedBy: string;
}