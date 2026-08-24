import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import {
  AssetLossRateRow,
  ReusableAssetCategory,
  ReusableAssetMovement,
  ReusableAssetType,
} from '../../../../shared/assetsTypes';

export function useReusableAssetTypes(filters: {
  branchId?: string;
  category?: ReusableAssetCategory;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: ['reusable-asset-types', filters],
    queryFn: () =>
      apiRequest<{ items: ReusableAssetType[]; total: number }>({
        method: 'GET',
        path: '/assets/reusable/types',
        query: {
          branchId: filters.branchId,
          category: filters.category,
          isActive:
            filters.isActive === undefined
              ? undefined
              : String(filters.isActive),
          limit: 100,
        },
      }),
  });
}

export function useAssetLossRate(filters: {
  branchId?: string;
  sinceDays?: number;
}) {
  return useQuery({
    queryKey: ['reusable-asset-loss-rate', filters],
    queryFn: () =>
      apiRequest<{ items: AssetLossRateRow[] }>({
        method: 'GET',
        path: '/assets/reusable/loss-rate',
        query: { branchId: filters.branchId, sinceDays: filters.sinceDays },
      }),
    enabled: !!filters.branchId,
  });
}

function invalidateReusable(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['reusable-asset-types'] });
  qc.invalidateQueries({ queryKey: ['reusable-asset-loss-rate'] });
}

export function useCreateAssetType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string;
      category: ReusableAssetCategory;
      unitValueCents?: number;
    }) =>
      apiRequest<{ assetType: ReusableAssetType }>({
        method: 'POST',
        path: '/assets/reusable/types',
        body: input,
      }),
    onSuccess: () => invalidateReusable(qc),
  });
}

export function useReceiveAssetStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assetTypeId,
      ...body
    }: {
      assetTypeId: string;
      branchId: string;
      quantity: number;
      notes?: string;
    }) =>
      apiRequest<{ movement: ReusableAssetMovement }>({
        method: 'POST',
        path: `/assets/reusable/types/${assetTypeId}/receive`,
        body,
      }),
    onSuccess: () => invalidateReusable(qc),
  });
}

export function useReportAssetLoss() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assetTypeId,
      ...body
    }: {
      assetTypeId: string;
      branchId: string;
      lossType: 'lost' | 'broken';
      quantity: number;
      reasonCode: string;
      notes?: string;
    }) =>
      apiRequest<{ movement: ReusableAssetMovement }>({
        method: 'POST',
        path: `/assets/reusable/types/${assetTypeId}/loss`,
        body,
      }),
    onSuccess: () => invalidateReusable(qc),
  });
}

export function useAdjustAssetStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      assetTypeId,
      ...body
    }: {
      assetTypeId: string;
      branchId: string;
      countedQuantity: number;
      notes?: string;
    }) =>
      apiRequest<{ movement: ReusableAssetMovement | null }>({
        method: 'POST',
        path: `/assets/reusable/types/${assetTypeId}/adjust`,
        body,
      }),
    onSuccess: () => invalidateReusable(qc),
  });
}
