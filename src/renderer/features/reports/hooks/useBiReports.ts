import { useQuery } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import {
  BranchSalesSummary,
  CustomerTrendRow,
  PeakHourRow,
  SalesSummary,
  TopSellerRow,
} from '../../../../shared/salesTypes';

interface DateRange {
  branchId?: string;
  from?: string;
  to?: string;
}

export function useSalesSummary(range: DateRange) {
  return useQuery({
    queryKey: ['reports', 'sales-summary', range],
    queryFn: () =>
      apiRequest<SalesSummary>({
        method: 'GET',
        path: '/reports/sales-summary',
        query: { ...range },
      }),
  });
}

export function useTopSellers(range: DateRange & { limit?: number }) {
  return useQuery({
    queryKey: ['reports', 'top-sellers', range],
    queryFn: () =>
      apiRequest<{ items: TopSellerRow[] }>({
        method: 'GET',
        path: '/reports/top-sellers',
        query: { ...range },
      }),
  });
}

export function usePeakHours(range: DateRange) {
  return useQuery({
    queryKey: ['reports', 'peak-hours', range],
    queryFn: () =>
      apiRequest<{ items: PeakHourRow[] }>({
        method: 'GET',
        path: '/reports/peak-hours',
        query: { ...range },
      }),
  });
}

export function useCustomerTrends(
  range: DateRange & { minVisits?: number; limit?: number },
) {
  return useQuery({
    queryKey: ['reports', 'customer-trends', range],
    queryFn: () =>
      apiRequest<{ items: CustomerTrendRow[] }>({
        method: 'GET',
        path: '/reports/customer-trends',
        query: { ...range },
      }),
  });
}

/** The one cross-branch endpoint — deliberately takes no branchId, only a
 * date window; every active branch gets a row. */
export function useReportsDashboard(range: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['reports', 'dashboard', range],
    queryFn: () =>
      apiRequest<{ branches: BranchSalesSummary[] }>({
        method: 'GET',
        path: '/reports/dashboard',
        query: { ...range },
      }),
  });
}
