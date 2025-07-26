// Financial section types
export type ClosureStatus = 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
export type SatisfactionRating = 1 | 2 | 3 | 4 | 5;
export type DayPeriod = 'lunch' | 'afternoon' | 'dinner';

export interface CashClosure {
  id: string;
  date: Date;
  submittedBy: string;
  submitterName: string;
  restaurantLocation?: string;
  
  // Payment collections
  cashCollected: number;
  lightspeedPayments: number;
  satispayPayments: number;
  carteBleueManual: number;
  customerCredit: number;
  giftVouchers: number;
  giftVouchersComment?: string;
  otherPayments: number;
  otherPaymentsComment?: string;
  
  // Covers by period
  lunchCovers: number;
  afternoonCovers: number;
  dinnerCovers: number;
  totalCovers: number;
  
  // Additional data
  notes?: string;
  satisfactionRating: SatisfactionRating;
  satisfactionComment?: string;
  
  // Status and workflow
  status: ClosureStatus;
  isLocked: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialReport {
  id: string;
  title: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  filters: {
    submitter?: string;
    location?: string;
    status?: ClosureStatus;
  };
  data: CashClosure[];
  totals: {
    cashCollected: number;
    totalPayments: number;
    totalCovers: number;
    averagePerCover: number;
  };
  generatedBy: string;
  generatedAt: Date;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: {
    dateRange?: {
      start: Date;
      end: Date;
    };
    submitter?: string;
    location?: string;
    status?: ClosureStatus;
  };
  createdBy: string;
  createdAt: Date;
}

export interface FinancialAnomalies {
  unusualCash: CashClosure[];
  missingCovers: CashClosure[];
  lowSatisfaction: CashClosure[];
}