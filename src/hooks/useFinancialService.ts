/**
 * Financial Service Hook
 * Separates financial business logic from UI components
 * Phase 3: Business Logic Separation
 */

import { useState, useCallback } from 'react';
import { DataService } from '@/core/services';
import { useToast } from '@/hooks/use-toast';

export interface UseFinancialServiceOptions {
  autoCalculate?: boolean;
  currency?: string;
}

export function useFinancialService(options: UseFinancialServiceOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const calculateTotals = useCallback((transactions: any[]) => {
    const totals = transactions.reduce((acc: any, transaction: any) => {
      if (transaction.type === 'revenue') {
        acc.revenue += transaction.amount || 0;
      } else if (transaction.type === 'expense') {
        acc.expenses += transaction.amount || 0;
      }
      return acc;
    }, { revenue: 0, expenses: 0 });

    return {
      ...totals,
      profit: totals.revenue - totals.expenses,
      profitMargin: totals.revenue > 0 ? ((totals.revenue - totals.expenses) / totals.revenue) * 100 : 0
    };
  }, []);

  const addTransaction = useCallback(async (transaction: {
    type: 'revenue' | 'expense';
    amount: number;
    description: string;
    category?: string;
    locationId?: string;
    date?: Date;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await DataService.insert('financial_transactions', {
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        location_id: transaction.locationId,
        transaction_date: transaction.date?.toISOString() || new Date().toISOString(),
        created_at: new Date().toISOString()
      });
      
      if (error) {
        const errorMessage = error.message || 'Failed to add transaction';
        setError(errorMessage);
        toast({
          title: 'Transaction Error',
          description: errorMessage,
          variant: 'destructive'
        });
        return { success: false, error: errorMessage };
      }

      toast({
        title: 'Transaction Added',
        description: `${transaction.type} of ${options.currency || '$'}${transaction.amount} recorded`
      });

      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [options.currency, toast]);

  const generateReport = useCallback(async (period: {
    startDate: Date;
    endDate: Date;
    locationId?: string;
    categories?: string[];
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const filters: any = {
        transaction_date: {
          gte: period.startDate.toISOString(),
          lte: period.endDate.toISOString()
        }
      };

      if (period.locationId) {
        filters.location_id = period.locationId;
      }

      if (period.categories && period.categories.length > 0) {
        filters.category = { in: period.categories };
      }

      const { data, error } = await DataService.query('financial_transactions', {
        filters,
        orderBy: { column: 'transaction_date', ascending: false }
      });
      
      if (error) {
        const errorMessage = error.message || 'Failed to generate report';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      const transactions = data || [];
      const totals = calculateTotals(transactions);
      
      const report = {
        period: {
          start: period.startDate,
          end: period.endDate
        },
        transactions,
        totals,
        summary: {
          totalTransactions: transactions.length,
          revenueTransactions: transactions.filter((t: any) => t.type === 'revenue').length,
          expenseTransactions: transactions.filter((t: any) => t.type === 'expense').length
        }
      };

      return { success: true, data: report };
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [calculateTotals]);

  const processPayment = useCallback(async (payment: {
    amount: number;
    method: 'cash' | 'card' | 'transfer';
    description?: string;
    metadata?: Record<string, any>;
  }) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await DataService.insert('payments', {
        amount: payment.amount,
        method: payment.method,
        description: payment.description,
        metadata: payment.metadata,
        status: 'completed',
        processed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
      
      if (error) {
        const errorMessage = error.message || 'Failed to process payment';
        setError(errorMessage);
        toast({
          title: 'Payment Error',
          description: errorMessage,
          variant: 'destructive'
        });
        return { success: false, error: errorMessage };
      }

      // Auto-create revenue transaction if enabled
      if (options.autoCalculate) {
        await addTransaction({
          type: 'revenue',
          amount: payment.amount,
          description: payment.description || `Payment via ${payment.method}`,
          category: 'payment'
        });
      }

      toast({
        title: 'Payment Processed',
        description: `Payment of ${options.currency || '$'}${payment.amount} processed successfully`
      });

      return { success: true, data };
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [options.autoCalculate, options.currency, addTransaction, toast]);

  const clearError = () => setError(null);

  return {
    addTransaction,
    generateReport,
    processPayment,
    calculateTotals,
    isLoading,
    error,
    clearError
  };
}