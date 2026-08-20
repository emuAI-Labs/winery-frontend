import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import {
  Expense,
  ExpenseCategory,
  ExpenseStatus,
} from '../../../../shared/salesTypes';

export function useExpenses(filters: {
  branchId?: string;
  category?: ExpenseCategory;
  status?: ExpenseStatus;
}) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () =>
      apiRequest<{ expenses: Expense[]; total: number }>({
        method: 'GET',
        path: '/expenses',
        query: {
          branchId: filters.branchId,
          category: filters.category,
          status: filters.status,
          limit: 100,
        },
      }),
  });
}

export function useExpensesDue(withinDays: number) {
  return useQuery({
    queryKey: ['expenses-due', withinDays],
    queryFn: () =>
      apiRequest<{ expenses: Expense[] }>({
        method: 'GET',
        path: '/expenses/due',
        query: { withinDays },
      }),
  });
}

export interface ExpenseInput {
  branchId: string;
  category: ExpenseCategory;
  description: string;
  amountCents: number;
  dueDate: string;
  supplierName?: string;
  frequency?: 'recurring';
  recurrenceIntervalDays?: number;
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpenseInput) =>
      apiRequest<Expense>({ method: 'POST', path: '/expenses', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['expenses-due'] });
    },
  });
}

export function useMarkExpensePaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paidDate }: { id: string; paidDate?: string }) =>
      apiRequest<Expense>({
        method: 'PATCH',
        path: `/expenses/${id}/mark-paid`,
        body: { paidDate },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['expenses-due'] });
    },
  });
}
