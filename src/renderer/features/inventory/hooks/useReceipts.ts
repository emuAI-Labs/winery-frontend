import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';

export interface ReceiptLineInput {
  itemId: string;
  quantity: number;
  unitCost?: number;
  batchCode?: string;
  expiryDate?: string;
  supplierName?: string;
}

export interface ReceiptInput {
  branchId: string;
  lines: ReceiptLineInput[];
}

/** Receiving is NOT idempotent server-side — the mutation is deliberately
 * not wired to any auto-retry-on-network-error logic. If it fails, the user
 * must check stock before resubmitting, never blindly retry. */
export function useReceiveStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ReceiptInput) =>
      apiRequest({ method: 'POST', path: '/inventory/receipts', body: input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
      qc.invalidateQueries({ queryKey: ['expiry-warnings'] });
    },
    retry: false,
  });
}
