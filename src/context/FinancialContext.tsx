import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CashClosure, FinancialReport, FilterPreset, FinancialAnomalies, ClosureStatus, SatisfactionRating } from '@/types/financial';

interface FinancialState {
  closures: CashClosure[];
  currentClosure: Partial<CashClosure> | null;
  reports: FinancialReport[];
  filterPresets: FilterPreset[];
  anomalies: FinancialAnomalies;
  loading: boolean;
}

type FinancialAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_CLOSURES'; payload: CashClosure[] }
  | { type: 'CREATE_CLOSURE'; payload: Partial<CashClosure> }
  | { type: 'UPDATE_CLOSURE'; payload: Partial<CashClosure> }
  | { type: 'SUBMIT_CLOSURE'; payload: CashClosure }
  | { type: 'UPDATE_CLOSURE_STATUS'; payload: { id: string; status: ClosureStatus } }
  | { type: 'LOCK_CLOSURE'; payload: string }
  | { type: 'UNLOCK_CLOSURE'; payload: string }
  | { type: 'LOAD_REPORTS'; payload: FinancialReport[] }
  | { type: 'ADD_REPORT'; payload: FinancialReport }
  | { type: 'LOAD_FILTER_PRESETS'; payload: FilterPreset[] }
  | { type: 'ADD_FILTER_PRESET'; payload: FilterPreset }
  | { type: 'DETECT_ANOMALIES'; payload: FinancialAnomalies };

const financialReducer = (state: FinancialState, action: FinancialAction): FinancialState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOAD_CLOSURES':
      return { ...state, closures: action.payload };
    case 'CREATE_CLOSURE':
      return { ...state, currentClosure: action.payload };
    case 'UPDATE_CLOSURE':
      return { 
        ...state, 
        currentClosure: state.currentClosure ? { ...state.currentClosure, ...action.payload } : action.payload 
      };
    case 'SUBMIT_CLOSURE':
      return {
        ...state,
        closures: [action.payload, ...state.closures],
        currentClosure: null
      };
    case 'UPDATE_CLOSURE_STATUS':
      return {
        ...state,
        closures: state.closures.map(closure =>
          closure.id === action.payload.id
            ? { ...closure, status: action.payload.status, updatedAt: new Date() }
            : closure
        )
      };
    case 'LOCK_CLOSURE':
      return {
        ...state,
        closures: state.closures.map(closure =>
          closure.id === action.payload
            ? { ...closure, isLocked: true, updatedAt: new Date() }
            : closure
        )
      };
    case 'UNLOCK_CLOSURE':
      return {
        ...state,
        closures: state.closures.map(closure =>
          closure.id === action.payload
            ? { ...closure, isLocked: false, updatedAt: new Date() }
            : closure
        )
      };
    case 'LOAD_REPORTS':
      return { ...state, reports: action.payload };
    case 'ADD_REPORT':
      return { ...state, reports: [action.payload, ...state.reports] };
    case 'LOAD_FILTER_PRESETS':
      return { ...state, filterPresets: action.payload };
    case 'ADD_FILTER_PRESET':
      return { ...state, filterPresets: [action.payload, ...state.filterPresets] };
    case 'DETECT_ANOMALIES':
      return { ...state, anomalies: action.payload };
    default:
      return state;
  }
};

interface FinancialContextType extends FinancialState {
  createNewClosure: () => void;
  updateCurrentClosure: (data: Partial<CashClosure>) => void;
  submitClosure: () => void;
  updateClosureStatus: (id: string, status: ClosureStatus) => void;
  lockClosure: (id: string) => void;
  unlockClosure: (id: string) => void;
  generateReport: (filters: any) => void;
  saveFilterPreset: (name: string, filters: any) => void;
  exportData: (format: 'csv' | 'pdf', data: CashClosure[]) => void;
  detectAnomalies: () => void;
  calculateTotalCovers: (lunch: number, afternoon: number, dinner: number) => number;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(financialReducer, {
    closures: [],
    currentClosure: null,
    reports: [],
    filterPresets: [],
    anomalies: {
      unusualCash: [],
      missingCovers: [],
      lowSatisfaction: []
    },
    loading: false
  });

  // Initialize with empty data
  useEffect(() => {
    dispatch({ type: 'LOAD_CLOSURES', payload: [] });
    dispatch({ type: 'LOAD_REPORTS', payload: [] });
    dispatch({ type: 'LOAD_FILTER_PRESETS', payload: [] });
  }, []);

  const createNewClosure = () => {
    const newClosure: Partial<CashClosure> = {
      id: Date.now().toString(),
      date: new Date(),
      submittedBy: 'current@user.com',
      submitterName: 'Current User',
      cashCollected: 0,
      lightspeedPayments: 0,
      satispayPayments: 0,
      carteBleueManual: 0,
      customerCredit: 0,
      giftVouchers: 0,
      otherPayments: 0,
      lunchCovers: 0,
      afternoonCovers: 0,
      dinnerCovers: 0,
      totalCovers: 0,
      satisfactionRating: 5,
      status: 'draft',
      isLocked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    dispatch({ type: 'CREATE_CLOSURE', payload: newClosure });
  };

  const updateCurrentClosure = (data: Partial<CashClosure>) => {
    // Auto-calculate total covers
    if (data.lunchCovers !== undefined || data.afternoonCovers !== undefined || data.dinnerCovers !== undefined) {
      const lunch = data.lunchCovers ?? state.currentClosure?.lunchCovers ?? 0;
      const afternoon = data.afternoonCovers ?? state.currentClosure?.afternoonCovers ?? 0;
      const dinner = data.dinnerCovers ?? state.currentClosure?.dinnerCovers ?? 0;
      data.totalCovers = lunch + afternoon + dinner;
    }
    
    dispatch({ type: 'UPDATE_CLOSURE', payload: { ...data, updatedAt: new Date() } });
  };

  const submitClosure = () => {
    if (!state.currentClosure) return;
    
    const completeClosure: CashClosure = {
      ...state.currentClosure as CashClosure,
      status: 'submitted',
      isLocked: true,
      updatedAt: new Date()
    };
    
    dispatch({ type: 'SUBMIT_CLOSURE', payload: completeClosure });
    
    // Send notification (would be implemented with real notification system)
    console.log('Notification sent to directors, finance, and super admins');
  };

  const updateClosureStatus = (id: string, status: ClosureStatus) => {
    dispatch({ type: 'UPDATE_CLOSURE_STATUS', payload: { id, status } });
  };

  const lockClosure = (id: string) => {
    dispatch({ type: 'LOCK_CLOSURE', payload: id });
  };

  const unlockClosure = (id: string) => {
    dispatch({ type: 'UNLOCK_CLOSURE', payload: id });
  };

  const generateReport = (filters: any) => {
    const filteredClosures = state.closures.filter(closure => {
      if (filters.dateRange) {
        const closureDate = new Date(closure.date);
        if (closureDate < filters.dateRange.start || closureDate > filters.dateRange.end) {
          return false;
        }
      }
      if (filters.submitter && closure.submittedBy !== filters.submitter) {
        return false;
      }
      if (filters.location && closure.restaurantLocation !== filters.location) {
        return false;
      }
      if (filters.status && closure.status !== filters.status) {
        return false;
      }
      return true;
    });

    const totals = filteredClosures.reduce((acc, closure) => ({
      cashCollected: acc.cashCollected + closure.cashCollected,
      totalPayments: acc.totalPayments + closure.cashCollected + closure.lightspeedPayments + 
                    closure.satispayPayments + closure.carteBleueManual + closure.customerCredit + 
                    closure.giftVouchers + closure.otherPayments,
      totalCovers: acc.totalCovers + closure.totalCovers,
      averagePerCover: 0 // Will be calculated after
    }), { cashCollected: 0, totalPayments: 0, totalCovers: 0, averagePerCover: 0 });

    totals.averagePerCover = totals.totalCovers > 0 ? totals.totalPayments / totals.totalCovers : 0;

    const report: FinancialReport = {
      id: Date.now().toString(),
      title: `Financial Report - ${new Date().toLocaleDateString()}`,
      dateRange: filters.dateRange,
      filters,
      data: filteredClosures,
      totals,
      generatedBy: 'current@user.com',
      generatedAt: new Date()
    };

    dispatch({ type: 'ADD_REPORT', payload: report });
  };

  const saveFilterPreset = (name: string, filters: any) => {
    const preset: FilterPreset = {
      id: Date.now().toString(),
      name,
      filters,
      createdBy: 'current@user.com',
      createdAt: new Date()
    };
    dispatch({ type: 'ADD_FILTER_PRESET', payload: preset });
  };

  const exportData = (format: 'csv' | 'pdf', data: CashClosure[]) => {
    // Implementation would depend on the export library used
    console.log(`Exporting ${data.length} records as ${format.toUpperCase()}`);
    
    if (format === 'csv') {
      const csvContent = [
        ['Date', 'Submitter', 'Cash', 'Cards', 'Total Covers', 'Satisfaction', 'Status'].join(','),
        ...data.map(closure => [
          closure.date.toLocaleDateString(),
          closure.submitterName,
          closure.cashCollected,
          closure.lightspeedPayments + closure.satispayPayments + closure.carteBleueManual,
          closure.totalCovers,
          closure.satisfactionRating,
          closure.status
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const detectAnomalies = () => {
    const averageCash = state.closures.reduce((sum, c) => sum + c.cashCollected, 0) / state.closures.length || 0;
    const threshold = averageCash * 0.5; // 50% deviation threshold

    const anomalies: FinancialAnomalies = {
      unusualCash: state.closures.filter(c => 
        c.cashCollected < threshold || c.cashCollected > averageCash * 1.5
      ),
      missingCovers: state.closures.filter(c => c.totalCovers === 0),
      lowSatisfaction: state.closures.filter(c => c.satisfactionRating <= 3)
    };

    dispatch({ type: 'DETECT_ANOMALIES', payload: anomalies });
  };

  const calculateTotalCovers = (lunch: number, afternoon: number, dinner: number) => {
    return lunch + afternoon + dinner;
  };

  return (
    <FinancialContext.Provider value={{
      ...state,
      createNewClosure,
      updateCurrentClosure,
      submitClosure,
      updateClosureStatus,
      lockClosure,
      unlockClosure,
      generateReport,
      saveFilterPreset,
      exportData,
      detectAnomalies,
      calculateTotalCovers
    }}>
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};