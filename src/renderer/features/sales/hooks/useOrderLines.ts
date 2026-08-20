import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import { Order } from '../../../../shared/salesTypes';

function invalidateOrder(
  qc: ReturnType<typeof useQueryClient>,
  orderId: string,
) {
  qc.invalidateQueries({ queryKey: ['orders', 'detail', orderId] });
  qc.invalidateQueries({ queryKey: ['orders'], exact: false });
}

export function useAddOrderLine(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      menuItemId: string;
      quantity: number;
      seatLabel?: string;
      notes?: string;
    }) =>
      apiRequest<{ order: Order }>({
        method: 'POST',
        path: `/orders/${orderId}/lines`,
        body: input,
      }),
    onSuccess: () => invalidateOrder(qc, orderId),
  });
}

export function useSendLine(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (lineId: string) =>
      apiRequest({
        method: 'PATCH',
        path: `/orders/${orderId}/lines/${lineId}/send`,
      }),
    onSuccess: () => invalidateOrder(qc, orderId),
  });
}

export function useServeLine(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      lineId,
      actualPourMl,
    }: {
      lineId: string;
      actualPourMl?: number;
    }) =>
      apiRequest({
        method: 'PATCH',
        path: `/orders/${orderId}/lines/${lineId}/serve`,
        body: actualPourMl ? { actualPourMl } : undefined,
      }),
    onSuccess: () => {
      invalidateOrder(qc, orderId);
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
    retry: 2,
  });
}

export function useVoidLine(orderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      lineId,
      reasonCode,
      notes,
    }: {
      lineId: string;
      reasonCode: string;
      notes?: string;
    }) =>
      apiRequest({
        method: 'POST',
        path: `/orders/${orderId}/lines/${lineId}/void`,
        body: { reasonCode, notes },
      }),
    onSuccess: () => invalidateOrder(qc, orderId),
  });
}
