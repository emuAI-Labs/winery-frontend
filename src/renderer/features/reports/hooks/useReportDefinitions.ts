import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import {
  ReportDefinition,
  ReportSchedule,
  ReportScheduleFrequency,
  ReportType,
} from '../../../../shared/salesTypes';

export interface ReportDefinitionListResult {
  items: ReportDefinition[];
  total: number;
  limit: number;
  offset: number;
}

export function useReportDefinitions(
  opts: { reportType?: ReportType; limit?: number; offset?: number } = {},
) {
  return useQuery({
    queryKey: ['report-definitions', opts],
    queryFn: () =>
      apiRequest<ReportDefinitionListResult>({
        method: 'GET',
        path: '/reports/definitions',
        query: {
          reportType: opts.reportType,
          limit: opts.limit ?? 25,
          offset: opts.offset ?? 0,
        },
      }),
  });
}

export interface CreateReportDefinitionInput {
  name: string;
  reportType: ReportType;
  branchId?: string;
  filters?: Record<string, unknown>;
}

export function useCreateReportDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateReportDefinitionInput) =>
      apiRequest<ReportDefinition>({
        method: 'POST',
        path: '/reports/definitions',
        body: input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['report-definitions'] }),
  });
}

/** Returns exactly what the underlying report endpoint would — no wrapping
 * envelope — so callers feed the result straight into whatever component
 * renders that report type. */
export function useRunReportDefinition(id: string | undefined) {
  return useQuery({
    queryKey: ['report-definitions', 'run', id],
    queryFn: () =>
      apiRequest<unknown>({
        method: 'GET',
        path: `/reports/definitions/${id}/run`,
      }),
    enabled: !!id,
  });
}

export function useReportSchedules(definitionId: string | undefined) {
  return useQuery({
    queryKey: ['report-schedules', definitionId],
    queryFn: () =>
      apiRequest<{ schedules: ReportSchedule[] } | ReportSchedule[]>({
        method: 'GET',
        path: `/reports/definitions/${definitionId}/schedules`,
      }),
    select: (data) => (Array.isArray(data) ? data : data.schedules),
    enabled: !!definitionId,
  });
}

export function useCreateReportSchedule(definitionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      frequency: ReportScheduleFrequency;
      recipientEmails: string[];
    }) =>
      apiRequest<ReportSchedule>({
        method: 'POST',
        path: `/reports/definitions/${definitionId}/schedules`,
        body: input,
      }),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['report-schedules', definitionId] }),
  });
}
