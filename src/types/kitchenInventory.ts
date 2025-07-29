// Kitchen Inventory types for monthly inventory management
export type KitchenCategory = 
  | 'dairy-derivatives'
  | 'meats-cold-cuts'
  | 'fish'
  | 'spices-seasonings'
  | 'preserves-oils-pickles'
  | 'nuts'
  | 'fresh-fruits-vegetables'
  | 'flours'
  | 'fruits';

export type KitchenUnit = 'kg' | 'L' | 'units' | 'g' | 'ml' | 'piece';

export type InventoryStatus = 'draft' | 'completed' | 'approved' | 'archived';

export interface KitchenProduct {
  id: string;
  name: string;
  
  category: KitchenCategory;
  unit: KitchenUnit;
  unitPrice: number;
  lastOrderDate?: Date;
  isFavorite: boolean;
}

export interface InventoryItem {
  productId: string;
  product: KitchenProduct;
  quantity: number;
  notes?: string;
  updatedBy: string;
  updatedAt: Date;
}

export interface MonthlyInventory {
  id: string;
  month: number;
  year: number;
  department: string;
  status: InventoryStatus;
  items: InventoryItem[];
  createdBy: string;
  createdAt: Date;
  completedBy?: string;
  completedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  totalValue: number;
  anomalies: InventoryAnomaly[];
  isLocked: boolean;
}

export interface InventoryAnomaly {
  id: string;
  type: 'quantity_spike' | 'value_spike' | 'rarely_updated' | 'missing_data';
  productId: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  currentValue: number;
  previousValue?: number;
  detectedAt: Date;
}

export interface InventoryNotification {
  id: string;
  type: 'inventory_reminder' | 'inventory_due' | 'inventory_completed' | 'inventory_approved';
  targetDepartment: string;
  targetUsers: string[];
  message: string;
  scheduledFor: Date;
  sentAt?: Date;
  isRecurring: boolean;
}

export interface InventoryExport {
  id: string;
  inventoryId: string;
  format: 'csv' | 'pdf';
  generatedBy: string;
  generatedAt: Date;
  url: string;
}

// Predefined product list
export const KITCHEN_PRODUCTS: KitchenProduct[] = [
  // Dairy and derivatives
  { id: 'dairy-01', name: 'Burrata', category: 'dairy-derivatives', unit: 'units', unitPrice: 0, isFavorite: false },
  { id: 'dairy-02', name: 'Buffalo mozzarella', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-03', name: 'Pizza mozzarella', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-04', name: 'Goat cheese', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-05', name: 'Grana Padano 1/8', category: 'dairy-derivatives', unit: 'units', unitPrice: 0, isFavorite: false },
  { id: 'dairy-06', name: 'Grana Padano shavings', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-07', name: 'Comté', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-08', name: 'Taleggio', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-09', name: 'Gorgonzola', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-10', name: 'Truffle pecorino', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-11', name: 'Primo sale', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-12', name: 'Mascarpone', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-13', name: 'Ricotta', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-14', name: 'Butter', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-15', name: 'Cream', category: 'dairy-derivatives', unit: 'L', unitPrice: 0, isFavorite: false },
  { id: 'dairy-16', name: 'Alberti cream', category: 'dairy-derivatives', unit: 'L', unitPrice: 0, isFavorite: false },
  { id: 'dairy-17', name: 'Milk', category: 'dairy-derivatives', unit: 'L', unitPrice: 0, isFavorite: false },

  // Meats and cold cuts
  { id: 'meat-01', name: 'White ham', category: 'meats-cold-cuts', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'meat-02', name: 'Parma ham', category: 'meats-cold-cuts', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'meat-03', name: 'Spicy spianata', category: 'meats-cold-cuts', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'meat-04', name: 'Mortadella', category: 'meats-cold-cuts', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'meat-05', name: 'Speck', category: 'meats-cold-cuts', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'meat-06', name: 'Bresaola', category: 'meats-cold-cuts', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'meat-07', name: 'Veal', category: 'meats-cold-cuts', unit: 'kg', unitPrice: 0, isFavorite: false },

  // Fish
  { id: 'fish-01', name: 'Tuna pizzeria', category: 'fish', unit: 'units', unitPrice: 0, isFavorite: false },
  { id: 'fish-02', name: 'Tuna kitchen', category: 'fish', unit: 'units', unitPrice: 0, isFavorite: false },
  { id: 'fish-03', name: 'Anchovies', category: 'fish', unit: 'units', unitPrice: 0, isFavorite: false },

  // Spices and seasonings
  { id: 'spice-01', name: 'Basil', category: 'spices-seasonings', unit: 'units', unitPrice: 0, isFavorite: false },
  { id: 'spice-02', name: 'Oregano', category: 'spices-seasonings', unit: 'units', unitPrice: 0, isFavorite: false },
  { id: 'spice-03', name: 'Pepper', category: 'spices-seasonings', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'spice-04', name: 'Salt', category: 'spices-seasonings', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'spice-05', name: 'Red chili', category: 'spices-seasonings', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'spice-06', name: 'Mint', category: 'spices-seasonings', unit: 'units', unitPrice: 0, isFavorite: false },
  { id: 'spice-07', name: 'Sugar', category: 'spices-seasonings', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'spice-08', name: 'Eggs', category: 'spices-seasonings', unit: 'units', unitPrice: 0, isFavorite: false },
  { id: 'spice-09', name: 'Dijon mustard', category: 'spices-seasonings', unit: 'units', unitPrice: 0, isFavorite: false },

  // Preserves oils and pickles
  { id: 'preserve-01', name: 'Artichokes', category: 'preserves-oils-pickles', unit: 'units', unitPrice: 0, isFavorite: false },
  { id: 'preserve-02', name: 'Sun-dried tomatoes', category: 'preserves-oils-pickles', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'preserve-03', name: 'Caper flowers', category: 'preserves-oils-pickles', unit: 'units', unitPrice: 0, isFavorite: false },
  { id: 'preserve-04', name: 'Pizza olives', category: 'preserves-oils-pickles', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'preserve-05', name: 'Extra virgin olive oil', category: 'preserves-oils-pickles', unit: 'L', unitPrice: 0, isFavorite: false },
  { id: 'preserve-06', name: 'Pistachio oil', category: 'preserves-oils-pickles', unit: 'L', unitPrice: 0, isFavorite: false },
  { id: 'preserve-07', name: 'Balsamic vinegar', category: 'preserves-oils-pickles', unit: 'L', unitPrice: 0, isFavorite: false },
  { id: 'preserve-08', name: 'White balsamic vinegar', category: 'preserves-oils-pickles', unit: 'L', unitPrice: 0, isFavorite: false },
  { id: 'preserve-09', name: 'Sherry vinegar', category: 'preserves-oils-pickles', unit: 'L', unitPrice: 0, isFavorite: false },
  { id: 'preserve-10', name: 'Small capers', category: 'preserves-oils-pickles', unit: 'units', unitPrice: 0, isFavorite: false },

  // Nuts
  { id: 'nuts-01', name: 'Pine nuts', category: 'nuts', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'nuts-02', name: 'Almonds', category: 'nuts', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'nuts-03', name: 'Hazelnuts', category: 'nuts', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'nuts-04', name: 'Hazelnut cream', category: 'nuts', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'nuts-05', name: 'Pistachios', category: 'nuts', unit: 'kg', unitPrice: 0, isFavorite: false },

  // Fresh fruits and vegetables
  { id: 'fresh-01', name: 'Salad', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-02', name: 'Rocket', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-03', name: 'Lemon', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-04', name: 'Orange', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-05', name: 'Beef heart tomato', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-06', name: 'Cherry tomato', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-07', name: 'Yellow pepper', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-08', name: 'Red pepper', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-09', name: 'Zucchini', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-10', name: 'Eggplants', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-11', name: 'Yellow onion', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-12', name: 'Red onion', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-13', name: 'Garlic', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-14', name: 'Cucumber', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-15', name: 'Mushroom', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },

  // Flours
  { id: 'flour-01', name: 'Type 00 flour', category: 'flours', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'flour-02', name: 'Stone-ground flour', category: 'flours', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'flour-03', name: 'Chickpea flour', category: 'flours', unit: 'kg', unitPrice: 0, isFavorite: false },

  // Fruits
  { id: 'fruit-01', name: 'Peaches', category: 'fruits', unit: 'kg', unitPrice: 0, isFavorite: false },
];