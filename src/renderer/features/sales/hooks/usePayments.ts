import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import { Payment, PaymentMethod } from '../../../../shared/salesTypes';

function invalidateOrder(
  qc: ReturnType<typeof useQueryClient>,
  orderId: string,
) {
  qc.invalidateQueries({ queryKey: ['orders', 'detail', orderId] });
  qc.invalidateQueries({ queryKey: ['orders'], exact: false });
}

export function useBillPayments(billId: string | undefined) {
  return useQuery({
    queryKey: ['payments', billId],
    queryFn: () =>
      apiRequest<{ payments: Payment[] }>({
        method: 'GET',
        path: `/orders/bills/${billId}/payments`,
      }),
    enabled: !!billId,
  });
}

export interface RecordPaymentInput {
  method: PaymentMethod;
  amountCents: number;
  mpesaCode?: string;
}

export function useRecordPayment(orderId: string, billId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RecordPaymentInput) =>
      apiRequest<{ payment: Payment }>({
        method: 'POST',
        path: `/orders/bills/${billId}/payments`,
        body: input,
      }),
    onSuccess: () => {
      invalidateOrder(qc, orderId);
      qc.invalidateQueries({ queryKey: ['payments', billId] });
    },
  });
}

export function useVoidPayment(orderId: string, billId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      paymentId,
      reasonCode,
    }: {
      paymentId: string;
      reasonCode: string;
    }) =>
      apiRequest({
        method: 'POST',
        path: `/orders/payments/${paymentId}/void`,
        body: { reasonCode },
      }),
    onSuccess: () => {
      invalidateOrder(qc, orderId);
      qc.invalidateQueries({ queryKey: ['payments', billId] });
    },
  });
}

/** Manager reconciliation, not part of checkout — lives outside a specific
 * order context, so it invalidates broadly rather than one order's cache. */
export function useConfirmMpesa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      paymentId,
      status,
    }: {
      paymentId: string;
      status: 'confirmed' | 'failed';
    }) =>
      apiRequest<{ payment: Payment }>({
        method: 'PATCH',
        path: `/orders/payments/${paymentId}/confirm-mpesa`,
        body: { status },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mpesa-pending'] });
      qc.invalidateQueries({ queryKey: ['orders'], exact: false });
    },
  });
}
