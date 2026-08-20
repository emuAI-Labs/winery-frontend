import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import { StockCount } from '../../../../shared/inventoryTypes';

export function useStockCount(id: string | undefined) {
  return useQuery({
    queryKey: ['stock-counts', 'detail', id],
    queryFn: () =>
      apiRequest<StockCount>({
        method: 'GET',
        path: `/inventory/stock-counts/${id}`,
      }),
    enabled: !!id,
  });
}

export function useOpenStockCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      branchId: string;
      itemIds?: string[];
      notes?: string;
    }) =>
      apiRequest<StockCount>({
        method: 'POST',
        path: '/inventory/stock-counts',
        body: input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stock-counts'] }),
  });
}

export function useSubmitStockCountLines() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      lines,
    }: {
      id: string;
      lines: { itemId: string; countedQuantity: number }[];
    }) =>
      apiRequest<StockCount>({
        method: 'POST',
        path: `/inventory/stock-counts/${id}/lines`,
        body: { lines },
      }),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ['stock-counts', 'detail', vars.id] }),
  });
}

export function useFinalizeStockCount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiRequest<StockCount>({
        method: 'POST',
        path: `/inventory/stock-counts/${id}/submit`,
      }),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['stock-counts', 'detail', id] });
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['stock'] });
    },
  });
}
