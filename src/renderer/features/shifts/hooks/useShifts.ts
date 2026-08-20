import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import { Shift, ShiftStatus } from '../../../../shared/salesTypes';

/** No dedicated "my active shift" endpoint — list scoped to self + open
 * status and take the first result, per the integration guide. */
export function useActiveShift(
  userId: string | undefined,
  branchId: string | undefined,
) {
  return useQuery({
    queryKey: ['shifts', 'active', userId, branchId],
    queryFn: async () => {
      const res = await apiRequest<{ shifts: Shift[] }>({
        method: 'GET',
        path: '/shifts',
        query: { userId, branchId, status: 'open', limit: 1 },
      });
      return res.shifts[0] ?? null;
    },
    enabled: !!userId && !!branchId,
  });
}

export function useShifts(filters: {
  branchId?: string;
  status?: ShiftStatus;
  userId?: string;
}) {
  return useQuery({
    queryKey: ['shifts', 'list', filters],
    queryFn: () =>
      apiRequest<{ shifts: Shift[] }>({
        method: 'GET',
        path: '/shifts',
        query: {
          branchId: filters.branchId,
          status: filters.status,
          userId: filters.userId,
          limit: 100,
        },
      }),
    enabled: !!filters.branchId,
  });
}

export function useOpenShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { branchId: string; openingFloatCents: number }) =>
      apiRequest<{ shift: Shift }>({
        method: 'POST',
        path: '/shifts',
        body: input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shifts'] }),
  });
}

export function useCloseShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...body
    }: {
      id: string;
      countedCashCents: number;
      notes?: string;
    }) =>
      apiRequest<{ shift: Shift }>({
        method: 'PATCH',
        path: `/shifts/${id}/close`,
        body,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['shifts'] }),
  });
}
