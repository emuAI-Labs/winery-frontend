import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiRequest from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { Shift, ShiftStatus } from '../../../../shared/salesTypes';

/** GET /shifts (list) requires shifts:read, which waiters/bartenders don't
 * hold — so it can't be used to find "my active shift" for the floor
 * roles that most need to open/close their own. GET /shifts/:id only
 * requires shifts:close and the backend lets an actor view their own
 * shift regardless of shifts:read, so instead we remember the id of the
 * shift *this browser session* opened (localStorage, scoped by user+
 * branch) and look it up by id. This covers the common case (open, work
 * the shift, close it later in the same running app) without any backend
 * change. A waiter who reopens the app after someone else's process
 * loses that id has no way to rediscover an already-open shift — that's
 * a genuine backend gap (no self-service "my current shift" endpoint)
 * worth a proper fix there, not papered over here. */
function activeShiftIdKey(userId: string, branchId: string) {
  return `winery:active-shift:${userId}:${branchId}`;
}

export function useActiveShift(
  userId: string | undefined,
  branchId: string | undefined,
) {
  return useQuery({
    queryKey: ['shifts', 'active', userId, branchId],
    queryFn: async () => {
      const cachedId = localStorage.getItem(
        activeShiftIdKey(userId as string, branchId as string),
      );
      if (!cachedId) return null;
      try {
        const res = await apiRequest<{ shift: Shift }>({
          method: 'GET',
          path: `/shifts/${cachedId}`,
        });
        if (res.shift.status !== 'open') {
          localStorage.removeItem(
            activeShiftIdKey(userId as string, branchId as string),
          );
          return null;
        }
        return res.shift;
      } catch {
        localStorage.removeItem(
          activeShiftIdKey(userId as string, branchId as string),
        );
        return null;
      }
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
    onSuccess: (res, input) => {
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        localStorage.setItem(
          activeShiftIdKey(userId, input.branchId),
          res.shift.id,
        );
      }
      qc.invalidateQueries({ queryKey: ['shifts'] });
    },
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
    onSuccess: (res) => {
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        localStorage.removeItem(activeShiftIdKey(userId, res.shift.branchId));
      }
      qc.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}
