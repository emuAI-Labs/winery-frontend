import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import { Bill, DiscountType, ReceiptData } from '../../../../shared/salesTypes';

function invalidateOrder(
  qc: ReturnType<typeof useQueryClient>,
  orderId: string,
) {
  qc.invalidateQueries({ queryKey: ['orders', 'detail', orderId] });
  qc.invalidateQueries({ queryKey: ['orders'], exact: false });
}

export type SplitInput =
  | { mode: 'by_item'; groups: string[][] }
  | { mode: 'by_seat' }
  | { mode: 'even'; guestCount: number };

export function useSplitBill(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SplitInput) =>
      apiRequest<{ bills: Bill[] }>({
        method: 'POST',
        path: `/orders/${orderId}/bills/split`,
        body: input,
      }),
    onSuccess: () => invalidateOrder(qc, orderId),
  });
}

export function useJoinBills(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (billIds: string[]) =>
      apiRequest<{ bill: Bill }>({
        method: 'POST',
        path: `/orders/${orderId}/bills/join`,
        body: { billIds },
      }),
    onSuccess: () => invalidateOrder(qc, orderId),
  });
}

export interface DiscountInput {
  type: DiscountType;
  valuePercent?: number;
  valueCents?: number;
  reasonCode: string;
  notes?: string;
  orderLineId?: string;
}

export function useApplyDiscount(orderId: string, billId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DiscountInput) =>
      apiRequest<{ bill: Bill }>({
        method: 'POST',
        path: `/orders/bills/${billId}/discounts`,
        body: input,
      }),
    onSuccess: () => invalidateOrder(qc, orderId),
  });
}

export function useReceipt(billId: string | undefined) {
  return useQuery({
    queryKey: ['receipt', billId],
    queryFn: () =>
      apiRequest<ReceiptData>({
        method: 'GET',
        path: `/orders/bills/${billId}/receipt`,
      }),
    enabled: !!billId,
  });
}
