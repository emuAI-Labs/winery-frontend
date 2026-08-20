import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import { Transfer, TransferStatus } from '../../../../shared/inventoryTypes';

export function useTransfers(filters: {
  branchId?: string;
  status?: TransferStatus;
}) {
  return useQuery({
    queryKey: ['transfers', filters],
    queryFn: () =>
      apiRequest<{ transfers: Transfer[] }>({
        method: 'GET',
        path: '/inventory/transfers',
        query: { branchId: filters.branchId, status: filters.status },
      }),
  });
}

export function useTransfer(id: string | undefined) {
  return useQuery({
    queryKey: ['transfers', 'detail', id],
    queryFn: () =>
      apiRequest<Transfer>({
        method: 'GET',
        path: `/inventory/transfers/${id}`,
      }),
    enabled: !!id,
  });
}

export interface CreateTransferInput {
  fromBranchId: string;
  toBranchId: string;
  notes?: string;
  lines: { itemId: string; quantity: number }[];
}

export function useCreateTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTransferInput) =>
      apiRequest<Transfer>({
        method: 'POST',
        path: '/inventory/transfers',
        body: input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['transfers'] }),
  });
}

function useTransferAction(action: 'approve' | 'complete' | 'cancel') {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<Transfer>({
        method: 'POST',
        path: `/inventory/transfers/${id}/${action}`,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transfers'] });
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}

export const useApproveTransfer = () => useTransferAction('approve');
export const useCompleteTransfer = () => useTransferAction('complete');
export const useCancelTransfer = () => useTransferAction('cancel');
