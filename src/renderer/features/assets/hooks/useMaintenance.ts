import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import {
  MaintenanceLog,
  MaintenanceSchedule,
} from '../../../../shared/assetsTypes';

export function useMaintenanceSchedules(filters: {
  assetId?: string;
  dueBefore?: string;
  isActive?: boolean;
}) {
  return useQuery({
    // backend returns { schedules } here, not the { items, total } wrapper
    // used everywhere else — kept unwrapped rather than forced into that
    // shape.
    queryKey: ['maintenance-schedules', filters],
    queryFn: () =>
      apiRequest<{ schedules: MaintenanceSchedule[] }>({
        method: 'GET',
        path: '/assets/maintenance/schedules',
        query: {
          assetId: filters.assetId,
          dueBefore: filters.dueBefore,
          isActive:
            filters.isActive === undefined
              ? undefined
              : String(filters.isActive),
        },
      }),
  });
}

export function useMaintenanceLogs(assetId: string | undefined) {
  return useQuery({
    queryKey: ['maintenance-logs', assetId],
    queryFn: () =>
      apiRequest<{ items: MaintenanceLog[]; total: number }>({
        method: 'GET',
        path: `/assets/${assetId}/maintenance-logs`,
        query: { limit: 100 },
      }),
    enabled: !!assetId,
  });
}

function invalidateMaintenance(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['maintenance-schedules'] });
  qc.invalidateQueries({ queryKey: ['maintenance-logs'] });
}

export function useCreateMaintenanceSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      assetId: string;
      title: string;
      intervalDays: number;
      nextDueDate: string;
    }) =>
      apiRequest<{ schedule: MaintenanceSchedule }>({
        method: 'POST',
        path: '/assets/maintenance/schedules',
        body: input,
      }),
    onSuccess: () => invalidateMaintenance(qc),
  });
}

export function useLogMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      scheduleId?: string;
      assetId: string;
      performedAt?: string;
      costCents?: number;
      notes?: string;
    }) =>
      apiRequest<{ log: MaintenanceLog }>({
        method: 'POST',
        path: '/assets/maintenance/logs',
        body: input,
      }),
    onSuccess: () => invalidateMaintenance(qc),
  });
}
