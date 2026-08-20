import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useSyncIssues() {
  const qc = useQueryClient();

  useEffect(
    () =>
      window.sync.onStatusChange(() =>
        qc.invalidateQueries({ queryKey: ['sync-issues'] }),
      ),
    [qc],
  );

  return useQuery({
    queryKey: ['sync-issues'],
    queryFn: () => window.sync.listIssues(),
  });
}

export function useRetrySyncIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => window.sync.retryIssue(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sync-issues'] }),
  });
}

export function useDiscardSyncIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => window.sync.discardIssue(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sync-issues'] }),
  });
}
