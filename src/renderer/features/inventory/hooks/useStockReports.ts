import { useQuery } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import {
  ConsolidatedStockItem,
  DeadStockItem,
  ExpiryWarning,
  ForecastResult,
  PourVariance,
} from '../../../../shared/inventoryTypes';

export function useConsolidatedStock(opts: {
  branchId?: string;
  category?: string;
  lowStockOnly?: boolean;
}) {
  return useQuery({
    queryKey: ['stock', 'consolidated', opts],
    queryFn: () =>
      apiRequest<{ items: ConsolidatedStockItem[] }>({
        method: 'GET',
        path: '/inventory/stock',
        query: {
          branchId: opts.branchId,
          category: opts.category,
          lowStockOnly: opts.lowStockOnly ? 'true' : undefined,
        },
      }),
  });
}

export function useExpiryWarnings(
  branchId: string | undefined,
  withinDays: number,
) {
  return useQuery({
    queryKey: ['expiry-warnings', branchId, withinDays],
    queryFn: () =>
      // API wraps the list as { batches: [...] }, not { warnings: [...] } —
      // normalized to `warnings` here so every consumer keeps the same shape.
      apiRequest<{ batches: ExpiryWarning[] }>({
        method: 'GET',
        path: '/inventory/expiry-warnings',
        query: { branchId, withinDays },
      }),
    select: (data) => ({ warnings: data.batches }),
  });
}

export function useDeadStock(branchId: string | undefined, sinceDays: number) {
  return useQuery({
    queryKey: ['dead-stock', branchId, sinceDays],
    queryFn: () =>
      apiRequest<{ items: DeadStockItem[] }>({
        method: 'GET',
        path: '/inventory/dead-stock',
        query: { branchId, sinceDays },
      }),
    enabled: !!branchId,
  });
}

export function useForecast(
  branchId: string | undefined,
  itemId: string | undefined,
  lookbackDays: number,
) {
  return useQuery({
    queryKey: ['forecast', branchId, itemId, lookbackDays],
    queryFn: () =>
      apiRequest<ForecastResult>({
        method: 'GET',
        path: '/inventory/forecast',
        query: { branchId, itemId, lookbackDays },
      }),
    enabled: !!branchId && !!itemId,
  });
}

export function usePourVariances(
  branchId: string | undefined,
  from?: string,
  to?: string,
) {
  return useQuery({
    queryKey: ['pour-variances', branchId, from, to],
    queryFn: () =>
      apiRequest<{ items: PourVariance[] }>({
        method: 'GET',
        path: '/inventory/pour-variances',
        query: { branchId, from, to, limit: 50 },
      }),
    enabled: !!branchId,
  });
}
