import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import {
  Order,
  OrderStatus,
  OrderSummary,
  OrderType,
} from '../../../../shared/salesTypes';

export function useOrders(filters: {
  branchId?: string;
  status?: OrderStatus;
  table?: string;
}) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () =>
      apiRequest<{ orders: OrderSummary[] }>({
        method: 'GET',
        path: '/orders',
        query: {
          branchId: filters.branchId,
          status: filters.status,
          table: filters.table,
          limit: 100,
        },
      }),
    enabled: !!filters.branchId,
    refetchInterval: 15_000,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: () =>
      apiRequest<{ order: Order }>({ method: 'GET', path: `/orders/${id}` }),
    enabled: !!id,
    refetchInterval: 10_000,
  });
}

export interface OpenOrderInput {
  branchId: string;
  orderType?: OrderType;
  tableLabel?: string;
  seatLabel?: string;
  guestCount?: number;
}

function invalidateOrder(qc: ReturnType<typeof useQueryClient>, id: string) {
  qc.invalidateQueries({ queryKey: ['orders', 'detail', id] });
  qc.invalidateQueries({ queryKey: ['orders'], exact: false });
}

export function useOpenOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: OpenOrderInput) =>
      apiRequest<{ order: OrderSummary }>({
        method: 'POST',
        path: '/orders',
        body: input,
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['orders'], exact: false }),
  });
}

function useOrderAction(action: 'hold' | 'resume' | 'close') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<{ order: OrderSummary }>({
        method: 'PATCH',
        path: `/orders/${id}/${action}`,
      }),
    onSuccess: (_data, id) => invalidateOrder(qc, id),
  });
}

export const useHoldOrder = () => useOrderAction('hold');
export const useResumeOrder = () => useOrderAction('resume');
export const useCloseOrder = () => useOrderAction('close');

export function useTransferOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      tableLabel?: string;
      seatLabel?: string;
    }) =>
      apiRequest<{ order: OrderSummary }>({
        method: 'PATCH',
        path: `/orders/${id}/transfer`,
        body,
      }),
    onSuccess: (_data, vars) => invalidateOrder(qc, vars.id),
  });
}
