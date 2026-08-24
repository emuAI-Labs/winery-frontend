import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import {
  Asset,
  AssetCategory,
  AssetStatus,
} from '../../../../shared/assetsTypes';

export function useAssets(filters: {
  branchId?: string;
  category?: AssetCategory;
  status?: AssetStatus;
}) {
  return useQuery({
    queryKey: ['assets', filters],
    queryFn: () =>
      apiRequest<{ items: Asset[]; total: number }>({
        method: 'GET',
        path: '/assets',
        query: {
          branchId: filters.branchId,
          category: filters.category,
          status: filters.status,
          limit: 100,
        },
      }),
    enabled: !!filters.branchId,
  });
}

export interface AssetInput {
  branchId: string;
  name: string;
  category: AssetCategory;
  serialNumber?: string;
  location?: string;
  purchaseValueCents: number;
  purchaseDate: string;
  usefulLifeMonths: number;
  salvageValueCents?: number;
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AssetInput) =>
      apiRequest<{ asset: Asset }>({
        method: 'POST',
        path: '/assets',
        body: input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      name?: string;
      location?: string | null;
      status?: AssetStatus;
      notes?: string | null;
    }) =>
      apiRequest<{ asset: Asset }>({
        method: 'PATCH',
        path: `/assets/${id}`,
        body,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  });
}
