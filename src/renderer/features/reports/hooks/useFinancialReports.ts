import { useQuery } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import {
  ExpenseSummaryRow,
  ProfitabilityRow,
  ShiftVarianceRow,
} from '../../../../shared/salesTypes';

interface DateRange {
  branchId?: string;
  from?: string;
  to?: string;
}

export function useProfitabilityReport(range: DateRange) {
  return useQuery({
    queryKey: ['reports', 'profitability', range],
    queryFn: () =>
      apiRequest<{ items: ProfitabilityRow[] }>({
        method: 'GET',
        path: '/reports/profitability',
        query: { ...range },
      }),
  });
}

export function useShiftVarianceReport(range: DateRange) {
  return useQuery({
    queryKey: ['reports', 'shift-variance', range],
    queryFn: () =>
      apiRequest<{
        shifts: ShiftVarianceRow[];
        totalVarianceCents: number;
        shiftCount: number;
      }>({
        method: 'GET',
        path: '/reports/shift-variance',
        query: { ...range },
      }),
  });
}

export function useExpenseSummaryReport(range: DateRange) {
  return useQuery({
    queryKey: ['reports', 'expense-summary', range],
    queryFn: () =>
      apiRequest<{ byCategory: ExpenseSummaryRow[]; totalCents: number }>({
        method: 'GET',
        path: '/reports/expenses-summary',
        query: { ...range },
      }),
  });
}
