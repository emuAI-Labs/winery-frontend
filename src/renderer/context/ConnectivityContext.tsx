import {
  createContext,
  useContext,
  useEffect,
  useState,
  PropsWithChildren,
} from 'react';
import { SyncStatus } from '../../shared/syncTypes';

const DEFAULT_STATUS: SyncStatus = {
  connectivity: 'online',
  outboxPendingCount: 0,
  outboxIssueCount: 0,
};

const ConnectivityContext = createContext<SyncStatus | null>(null);

/** Mirrors BranchContext's pattern — a small provider backed by an IPC push
 * channel instead of a query, since connectivity state changes are events,
 * not something worth polling for. */
export function ConnectivityProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<SyncStatus>(DEFAULT_STATUS);

  useEffect(() => {
    window.sync
      .getStatus()
      .then(setStatus)
      .catch(() => {});
    return window.sync.onStatusChange(setStatus);
  }, []);

  return (
    <ConnectivityContext.Provider value={status}>
      {children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivity(): SyncStatus {
  const ctx = useContext(ConnectivityContext);
  if (!ctx)
    throw new Error('useConnectivity must be used within ConnectivityProvider');
  return ctx;
}
