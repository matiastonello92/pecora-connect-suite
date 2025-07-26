// Cash register and POS types
export type PaymentMethod = 'cash' | 'card' | 'digital' | 'voucher';
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type OrderType = 'dine-in' | 'takeaway' | 'delivery';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  allergens?: string[];
  isAvailable: boolean;
  preparationTime: number;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  modifications?: string[];
  price: number;
}

export interface Order {
  id: string;
  tableNumber?: number;
  customerName?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod?: PaymentMethod;
  status: OrderStatus;
  type: OrderType;
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface CashSession {
  id: string;
  startAmount: number;
  endAmount?: number;
  cashSales: number;
  cardSales: number;
  digitalSales: number;
  voucherSales: number;
  totalSales: number;
  startedBy: string;
  startedAt: Date;
  endedBy?: string;
  endedAt?: Date;
  isActive: boolean;
}