import { useQuery } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import { ReconciliationReport } from '../../../../shared/salesTypes';

interface ReconciliationParams {
  branchId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

/** The backend paginates all three sections off one shared limit/offset
 * pair (not one per section) — see REPORTING_INTEGRATION.md. */
export function useReconciliation(params: ReconciliationParams) {
  return useQuery({
    queryKey: ['reports', 'reconciliation', params],
    queryFn: () =>
      apiRequest<ReconciliationReport>({
        method: 'GET',
        path: '/reports/reconciliation',
        query: {
          ...params,
          limit: params.limit ?? 10,
          offset: params.offset ?? 0,
        },
      }),
  });
}
