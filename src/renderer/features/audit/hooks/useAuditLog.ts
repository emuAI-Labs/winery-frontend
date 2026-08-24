import { useQuery } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import { AuditLogRow } from '../../../../shared/auditTypes';

export function useAuditLog(filters: {
  action?: string;
  actorId?: string;
  from?: string;
  to?: string;
}) {
  return useQuery({
    queryKey: ['audit-log', filters],
    queryFn: () =>
      apiRequest<{ items: AuditLogRow[]; total: number }>({
        method: 'GET',
        path: '/audit',
        query: {
          action: filters.action,
          actorId: filters.actorId,
          from: filters.from,
          to: filters.to,
          limit: 100,
        },
      }),
  });
}
