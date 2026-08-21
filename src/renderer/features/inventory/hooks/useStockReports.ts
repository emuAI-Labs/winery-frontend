import { useQuery } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import {
  ConsolidatedStockItem,
  DeadStockItem,
  ExpiryWarning,
  ForecastResult,
  PourVariance,
} from '../../../../shared/inventoryTypes';

interface Page {
  total: number;
  limit: number;
  offset: number;
}

export function useConsolidatedStock(opts: {
  branchId?: string;
  category?: string;
  lowStockOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['stock', 'consolidated', opts],
    queryFn: () =>
      apiRequest<{ items: ConsolidatedStockItem[] } & Page>({
        method: 'GET',
        path: '/inventory/stock',
        query: {
          branchId: opts.branchId,
          category: opts.category,
          lowStockOnly: opts.lowStockOnly ? 'true' : undefined,
          limit: opts.limit ?? 50,
          offset: opts.offset ?? 0,
        },
      }),
  });
}

export function useExpiryWarnings(
  branchId: string | undefined,
  withinDays: number,
  opts: { limit?: number; offset?: number } = {},
) {
  return useQuery({
    queryKey: ['expiry-warnings', branchId, withinDays, opts],
    queryFn: () =>
      apiRequest<{ items: ExpiryWarning[] } & Page>({
        method: 'GET',
        path: '/inventory/expiry-warnings',
        query: {
          branchId,
          withinDays,
          limit: opts.limit ?? 50,
          offset: opts.offset ?? 0,
        },
      }),
    // normalized to `warnings` so consumers don't have to change on rename
    select: (data) => ({ ...data, warnings: data.items }),
  });
}

export function useDeadStock(
  branchId: string | undefined,
  sinceDays: number,
  opts: { limit?: number; offset?: number } = {},
) {
  return useQuery({
    queryKey: ['dead-stock', branchId, sinceDays, opts],
    queryFn: () =>
      apiRequest<{ items: DeadStockItem[] } & Page>({
        method: 'GET',
        path: '/inventory/dead-stock',
        query: {
          branchId,
          sinceDays,
          limit: opts.limit ?? 50,
          offset: opts.offset ?? 0,
        },
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
