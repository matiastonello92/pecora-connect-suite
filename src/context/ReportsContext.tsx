import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Report, ReportType, TimeRange, SalesReport, InventoryReport, StaffReport } from '@/types/reports';

interface ReportsState {
  reports: Report[];
  loading: boolean;
  currentReport: Report | null;
}

type ReportsAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_REPORTS'; payload: Report[] }
  | { type: 'ADD_REPORT'; payload: Report }
  | { type: 'SET_CURRENT_REPORT'; payload: Report | null };

const reportsReducer = (state: ReportsState, action: ReportsAction): ReportsState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOAD_REPORTS':
      return { ...state, reports: action.payload };
    case 'ADD_REPORT':
      return { ...state, reports: [action.payload, ...state.reports] };
    case 'SET_CURRENT_REPORT':
      return { ...state, currentReport: action.payload };
    default:
      return state;
  }
};

interface ReportsContextType extends ReportsState {
  generateReport: (type: ReportType, period: TimeRange, startDate: Date, endDate: Date) => void;
  getSalesReport: (startDate: Date, endDate: Date) => SalesReport;
  getInventoryReport: (startDate: Date, endDate: Date) => InventoryReport;
  getStaffReport: (startDate: Date, endDate: Date) => StaffReport;
  exportReport: (reportId: string, format: 'pdf' | 'csv' | 'excel') => void;
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export const ReportsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reportsReducer, {
    reports: [],
    loading: false,
    currentReport: null
  });

  // Mock data
  useEffect(() => {
    const mockReports: Report[] = [
      {
        id: '1',
        type: 'sales',
        title: 'Weekly Sales Report',
        period: 'week',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        data: {
          period: 'Week of ' + new Date().toLocaleDateString(),
          totalSales: 15420.50,
          totalOrders: 234,
          averageOrder: 65.90,
          topItems: [
            { itemId: '1', name: 'Margherita Pizza', quantity: 45, revenue: 652.50 },
            { itemId: '2', name: 'Truffle Risotto', quantity: 28, revenue: 616.00 }
          ],
          paymentMethods: {
            cash: 3200.50,
            card: 8920.00,
            digital: 2800.00,
            voucher: 500.00
          },
          hourlyBreakdown: [
            { hour: 12, sales: 2340.50, orders: 28 },
            { hour: 13, sales: 3120.00, orders: 35 },
            { hour: 19, sales: 4200.00, orders: 45 }
          ]
        } as SalesReport,
        generatedBy: 'manager@pecora.com',
        generatedAt: new Date()
      }
    ];

    dispatch({ type: 'LOAD_REPORTS', payload: mockReports });
  }, []);

  const generateReport = (type: ReportType, period: TimeRange, startDate: Date, endDate: Date) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    // Simulate API call
    setTimeout(() => {
      let reportData: SalesReport | InventoryReport | StaffReport;
      
      switch (type) {
        case 'sales':
          reportData = getSalesReport(startDate, endDate);
          break;
        case 'inventory':
          reportData = getInventoryReport(startDate, endDate);
          break;
        case 'staff':
          reportData = getStaffReport(startDate, endDate);
          break;
        default:
          reportData = getSalesReport(startDate, endDate);
      }

      const newReport: Report = {
        id: Date.now().toString(),
        type,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${period}`,
        period,
        startDate,
        endDate,
        data: reportData,
        generatedBy: 'current@user.com',
        generatedAt: new Date()
      };

      dispatch({ type: 'ADD_REPORT', payload: newReport });
      dispatch({ type: 'SET_LOADING', payload: false });
    }, 1500);
  };

  const getSalesReport = (startDate: Date, endDate: Date): SalesReport => {
    return {
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      totalSales: 18650.75,
      totalOrders: 298,
      averageOrder: 62.58,
      topItems: [
        { itemId: '1', name: 'Margherita Pizza', quantity: 56, revenue: 812.00 },
        { itemId: '2', name: 'Truffle Risotto', quantity: 34, revenue: 748.00 },
        { itemId: '3', name: 'Tiramisu', quantity: 42, revenue: 357.00 }
      ],
      paymentMethods: {
        cash: 4200.25,
        card: 11230.50,
        digital: 2920.00,
        voucher: 300.00
      },
      hourlyBreakdown: [
        { hour: 11, sales: 1250.00, orders: 18 },
        { hour: 12, sales: 2840.50, orders: 34 },
        { hour: 13, sales: 3420.00, orders: 42 },
        { hour: 18, sales: 2100.00, orders: 28 },
        { hour: 19, sales: 4200.00, orders: 52 },
        { hour: 20, sales: 3840.25, orders: 48 }
      ]
    };
  };

  const getInventoryReport = (startDate: Date, endDate: Date): InventoryReport => {
    return {
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      totalValue: 25840.00,
      lowStockItems: 8,
      wasteAmount: 420.50,
      topConsumed: [
        { itemId: '1', name: 'Tomatoes', consumed: 45, value: 180.00 },
        { itemId: '2', name: 'Mozzarella', consumed: 28, value: 392.00 },
        { itemId: '3', name: 'Flour', consumed: 120, value: 240.00 }
      ]
    };
  };

  const getStaffReport = (startDate: Date, endDate: Date): StaffReport => {
    return {
      period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
      totalHours: 520,
      departmentBreakdown: {
        kitchen: { hours: 180, cost: 3600.00 },
        service: { hours: 160, cost: 2880.00 },
        management: { hours: 80, cost: 2400.00 },
        cleaning: { hours: 100, cost: 1500.00 }
      },
      productivity: [
        { userId: '1', name: 'Marco Rossi', hours: 40, ordersProcessed: 156, efficiency: 92 },
        { userId: '2', name: 'Sofia Bianchi', hours: 35, ordersProcessed: 142, efficiency: 88 },
        { userId: '3', name: 'Luigi Verde', hours: 38, efficiency: 85 }
      ]
    };
  };

  const exportReport = (reportId: string, format: 'pdf' | 'csv' | 'excel') => {
    console.log(`Exporting report ${reportId} as ${format}`);
    // Mock export functionality
  };

  return (
    <ReportsContext.Provider value={{
      ...state,
      generateReport,
      getSalesReport,
      getInventoryReport,
      getStaffReport,
      exportReport
    }}>
      {children}
    </ReportsContext.Provider>
  );
};

export const useReports = () => {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
};