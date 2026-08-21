import { useQuery } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import { Order, Payment } from '../../../../shared/salesTypes';

export interface PendingMpesaRow {
  payment: Payment;
  orderId: string;
  billId: string;
  tableLabel?: string | null;
}

/** There's no global "list pending M-PESA payments" endpoint — only
 * per-bill GET /orders/bills/:billId/payments. This aggregates across every
 * currently open/held order at the branch, which covers the common case
 * (reconciling while the tab is still running) but NOT a tab that's already
 * been closed — there's no way to find that bill's payments without knowing
 * its id. Flagged rather than faked; ask backend for a proper endpoint if
 * closed-tab reconciliation turns out to matter. */
async function fetchPendingMpesa(branchId: string): Promise<PendingMpesaRow[]> {
  const [openRes, heldRes] = await Promise.all([
    apiRequest<{ orders: Order[] }>({
      method: 'GET',
      path: '/orders',
      query: { branchId, status: 'open', limit: 100 },
    }),
    apiRequest<{ orders: Order[] }>({
      method: 'GET',
      path: '/orders',
      query: { branchId, status: 'held', limit: 100 },
    }),
  ]);
  const orders = [...openRes.orders, ...heldRes.orders];
  const billIds = orders.flatMap((o) =>
    o.bills.map((b) => ({
      orderId: o.id,
      billId: b.id,
      tableLabel: o.tableLabel,
    })),
  );

  const paymentsPerBill = await Promise.all(
    billIds.map(async ({ orderId, billId, tableLabel }) => {
      const res = await apiRequest<{ payments: Payment[] }>({
        method: 'GET',
        path: `/orders/bills/${billId}/payments`,
      });
      return res.payments
        .filter(
          (p) =>
            p.method === 'mpesa' &&
            p.mpesaStatus === 'pending_confirmation' &&
            !p.voidedAt,
        )
        .map((payment) => ({ payment, orderId, billId, tableLabel }));
    }),
  );

  return paymentsPerBill.flat();
}

export function useMpesaPending(branchId: string | undefined) {
  return useQuery({
    queryKey: ['mpesa-pending', branchId],
    queryFn: () => fetchPendingMpesa(branchId as string),
    enabled: !!branchId,
    refetchInterval: 30_000,
  });
}
