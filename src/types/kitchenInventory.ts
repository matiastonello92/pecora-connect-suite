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
  nameKey: string; // Translation key
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

// Predefined product list with translation keys
export const KITCHEN_PRODUCTS: KitchenProduct[] = [
  // Dairy and derivatives
  { id: 'dairy-01', name: 'Burrata', nameKey: 'products.burrata', category: 'dairy-derivatives', unit: 'units', unitPrice: 0, isFavorite: false },
  { id: 'dairy-02', name: 'Buffalo mozzarella', nameKey: 'products.buffalo_mozzarella', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-03', name: 'Pizza mozzarella', nameKey: 'products.pizza_mozzarella', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-04', name: 'Goat cheese', nameKey: 'products.goat_cheese', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-05', name: 'Grana Padano 1/8', nameKey: 'products.grana_padano_eighth', category: 'dairy-derivatives', unit: 'units', unitPrice: 0, isFavorite: false },
  { id: 'dairy-06', name: 'Grana Padano shavings', nameKey: 'products.grana_padano_shavings', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-07', name: 'Comté', nameKey: 'products.comte', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-08', name: 'Taleggio', nameKey: 'products.taleggio', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-09', name: 'Gorgonzola', nameKey: 'products.gorgonzola', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-10', name: 'Truffle pecorino', nameKey: 'products.truffle_pecorino', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-11', name: 'Primo sale', nameKey: 'products.primo_sale', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-12', name: 'Mascarpone', nameKey: 'products.mascarpone', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-13', name: 'Ricotta', nameKey: 'products.ricotta', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-14', name: 'Butter', nameKey: 'products.butter', category: 'dairy-derivatives', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'dairy-15', name: 'Cream', nameKey: 'products.cream', category: 'dairy-derivatives', unit: 'L', unitPrice: 0, isFavorite: false },
  { id: 'dairy-16', name: 'Alberti cream', nameKey: 'products.alberti_cream', category: 'dairy-derivatives', unit: 'L', unitPrice: 0, isFavorite: false },
  { id: 'dairy-17', name: 'Milk', nameKey: 'products.milk', category: 'dairy-derivatives', unit: 'L', unitPrice: 0, isFavorite: false },

  // Meats and cold cuts
  { id: 'meat-01', name: 'White ham', nameKey: 'products.white_ham', category: 'meats-cold-cuts', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'meat-02', name: 'Parma ham', nameKey: 'products.parma_ham', category: 'meats-cold-cuts', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'meat-03', name: 'Spicy spianata', nameKey: 'products.spicy_spianata', category: 'meats-cold-cuts', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'meat-04', name: 'Mortadella', nameKey: 'products.mortadella', category: 'meats-cold-cuts', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'meat-05', name: 'Speck', nameKey: 'products.speck', category: 'meats-cold-cuts', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'meat-06', name: 'Bresaola', nameKey: 'products.bresaola', category: 'meats-cold-cuts', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'meat-07', name: 'Veal', nameKey: 'products.veal', category: 'meats-cold-cuts', unit: 'kg', unitPrice: 0, isFavorite: false },

  // Fish
  { id: 'fish-01', name: 'Tuna pizzeria', nameKey: 'products.tuna_pizzeria', category: 'fish', unit: 'units', unitPrice: 0, isFavorite: false },
  { id: 'fish-02', name: 'Tuna kitchen', nameKey: 'products.tuna_kitchen', category: 'fish', unit: 'units', unitPrice: 0, isFavorite: false },
  { id: 'fish-03', name: 'Anchovies', nameKey: 'products.anchovies', category: 'fish', unit: 'units', unitPrice: 0, isFavorite: false },

  // Spices and seasonings
  { id: 'spice-01', name: 'Basil', nameKey: 'products.basil', category: 'spices-seasonings', unit: 'units', unitPrice: 0, isFavorite: false },
  { id: 'spice-02', name: 'Oregano', nameKey: 'products.oregano', category: 'spices-seasonings', unit: 'units', unitPrice: 0, isFavorite: false },
  { id: 'spice-03', name: 'Pepper', nameKey: 'products.pepper', category: 'spices-seasonings', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'spice-04', name: 'Salt', nameKey: 'products.salt', category: 'spices-seasonings', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'spice-05', name: 'Red chili', nameKey: 'products.red_chili', category: 'spices-seasonings', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'spice-06', name: 'Mint', nameKey: 'products.mint', category: 'spices-seasonings', unit: 'units', unitPrice: 0, isFavorite: false },
  { id: 'spice-07', name: 'Sugar', nameKey: 'products.sugar', category: 'spices-seasonings', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'spice-08', name: 'Eggs', nameKey: 'products.eggs', category: 'spices-seasonings', unit: 'units', unitPrice: 0, isFavorite: false },
  { id: 'spice-09', name: 'Dijon mustard', nameKey: 'products.dijon_mustard', category: 'spices-seasonings', unit: 'units', unitPrice: 0, isFavorite: false },

  // Preserves oils and pickles
  { id: 'preserve-01', name: 'Artichokes', nameKey: 'products.artichokes', category: 'preserves-oils-pickles', unit: 'units', unitPrice: 0, isFavorite: false },
  { id: 'preserve-02', name: 'Sun-dried tomatoes', nameKey: 'products.sun_dried_tomatoes', category: 'preserves-oils-pickles', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'preserve-03', name: 'Caper flowers', nameKey: 'products.caper_flowers', category: 'preserves-oils-pickles', unit: 'units', unitPrice: 0, isFavorite: false },
  { id: 'preserve-04', name: 'Pizza olives', nameKey: 'products.pizza_olives', category: 'preserves-oils-pickles', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'preserve-05', name: 'Extra virgin olive oil', nameKey: 'products.olive_oil', category: 'preserves-oils-pickles', unit: 'L', unitPrice: 0, isFavorite: false },
  { id: 'preserve-06', name: 'Pistachio oil', nameKey: 'products.pistachio_oil', category: 'preserves-oils-pickles', unit: 'L', unitPrice: 0, isFavorite: false },
  { id: 'preserve-07', name: 'Balsamic vinegar', nameKey: 'products.balsamic_vinegar', category: 'preserves-oils-pickles', unit: 'L', unitPrice: 0, isFavorite: false },
  { id: 'preserve-08', name: 'White balsamic vinegar', nameKey: 'products.white_balsamic_vinegar', category: 'preserves-oils-pickles', unit: 'L', unitPrice: 0, isFavorite: false },
  { id: 'preserve-09', name: 'Sherry vinegar', nameKey: 'products.sherry_vinegar', category: 'preserves-oils-pickles', unit: 'L', unitPrice: 0, isFavorite: false },
  { id: 'preserve-10', name: 'Small capers', nameKey: 'products.small_capers', category: 'preserves-oils-pickles', unit: 'units', unitPrice: 0, isFavorite: false },

  // Nuts
  { id: 'nuts-01', name: 'Pine nuts', nameKey: 'products.pine_nuts', category: 'nuts', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'nuts-02', name: 'Almonds', nameKey: 'products.almonds', category: 'nuts', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'nuts-03', name: 'Hazelnuts', nameKey: 'products.hazelnuts', category: 'nuts', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'nuts-04', name: 'Hazelnut cream', nameKey: 'products.hazelnut_cream', category: 'nuts', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'nuts-05', name: 'Pistachios', nameKey: 'products.pistachios', category: 'nuts', unit: 'kg', unitPrice: 0, isFavorite: false },

  // Fresh fruits and vegetables
  { id: 'fresh-01', name: 'Salad', nameKey: 'products.salad', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-02', name: 'Rocket', nameKey: 'products.rocket', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-03', name: 'Lemon', nameKey: 'products.lemon', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-04', name: 'Orange', nameKey: 'products.orange', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-05', name: 'Beef heart tomato', nameKey: 'products.beef_heart_tomato', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-06', name: 'Cherry tomato', nameKey: 'products.cherry_tomato', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-07', name: 'Yellow pepper', nameKey: 'products.yellow_pepper', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-08', name: 'Red pepper', nameKey: 'products.red_pepper', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-09', name: 'Zucchini', nameKey: 'products.zucchini', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-10', name: 'Eggplants', nameKey: 'products.eggplants', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-11', name: 'Yellow onion', nameKey: 'products.yellow_onion', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-12', name: 'Red onion', nameKey: 'products.red_onion', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-13', name: 'Garlic', nameKey: 'products.garlic', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-14', name: 'Cucumber', nameKey: 'products.cucumber', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'fresh-15', name: 'Mushroom', nameKey: 'products.mushroom', category: 'fresh-fruits-vegetables', unit: 'kg', unitPrice: 0, isFavorite: false },

  // Flours
  { id: 'flour-01', name: 'Type 00 flour', nameKey: 'products.type_00_flour', category: 'flours', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'flour-02', name: 'Stone-ground flour', nameKey: 'products.stone_ground_flour', category: 'flours', unit: 'kg', unitPrice: 0, isFavorite: false },
  { id: 'flour-03', name: 'Chickpea flour', nameKey: 'products.chickpea_flour', category: 'flours', unit: 'kg', unitPrice: 0, isFavorite: false },

  // Fruits
  { id: 'fruit-01', name: 'Peaches', nameKey: 'products.peaches', category: 'fruits', unit: 'kg', unitPrice: 0, isFavorite: false },
];