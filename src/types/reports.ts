// Reports and analytics types
import { PaymentMethod } from './cashRegister';

export type ReportType = 'sales' | 'inventory' | 'staff' | 'customer' | 'financial';
export type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface SalesReport {
  period: string;
  totalSales: number;
  totalOrders: number;
  averageOrder: number;
  topItems: Array<{
    itemId: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  paymentMethods: Record<PaymentMethod, number>;
  hourlyBreakdown: Array<{
    hour: number;
    sales: number;
    orders: number;
  }>;
}

export interface InventoryReport {
  period: string;
  totalValue: number;
  lowStockItems: number;
  wasteAmount: number;
  topConsumed: Array<{
    itemId: string;
    name: string;
    consumed: number;
    value: number;
  }>;
}

export interface StaffReport {
  period: string;
  totalHours: number;
  departmentBreakdown: Record<string, {
    hours: number;
    cost: number;
  }>;
  productivity: Array<{
    userId: string;
    name: string;
    hours: number;
    ordersProcessed?: number;
    efficiency: number;
  }>;
}

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  period: TimeRange;
  startDate: Date;
  endDate: Date;
  data: SalesReport | InventoryReport | StaffReport;
  generatedBy: string;
  generatedAt: Date;
}