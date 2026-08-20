import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import {
  Requisition,
  RequisitionStatus,
} from '../../../../shared/inventoryTypes';

export function useRequisitions(filters: {
  branchId?: string;
  status?: RequisitionStatus;
}) {
  return useQuery({
    queryKey: ['requisitions', filters],
    queryFn: () =>
      apiRequest<{ requisitions: Requisition[] }>({
        method: 'GET',
        path: '/inventory/requisitions',
        query: { branchId: filters.branchId, status: filters.status },
      }),
  });
}

export function useAutoGenerateRequisitions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (branchId?: string) =>
      apiRequest<{ requisitions: Requisition[] }>({
        method: 'POST',
        path: '/inventory/requisitions/auto-generate',
        body: { branchId },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requisitions'] }),
  });
}

export function useApproveRequisition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<Requisition>({
        method: 'POST',
        path: `/inventory/requisitions/${id}/approve`,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requisitions'] }),
  });
}
