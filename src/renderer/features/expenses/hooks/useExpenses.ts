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
      // API wraps this list as { items: [...] }, not { expenses: [...] } —
      // normalized to `expenses` here so the consumer shape stays stable.
      apiRequest<{ items: Expense[]; total: number }>({
        method: 'GET',
        path: '/expenses',
        query: {
          branchId: filters.branchId,
          category: filters.category,
          status: filters.status,
          limit: 100,
        },
      }),
    select: (data) => ({ expenses: data.items, total: data.total }),
  });
}

export function useExpensesDue(withinDays: number) {
  return useQuery({
    queryKey: ['expenses-due', withinDays],
    queryFn: () =>
      // API wraps this as { items: [...] }, not { expenses: [...] } —
      // normalized to `expenses` so the consumer shape stays stable.
      apiRequest<{ items: Expense[]; total: number }>({
        method: 'GET',
        path: '/expenses/due',
        query: { withinDays },
      }),
    select: (data) => ({ expenses: data.items, total: data.total }),
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
