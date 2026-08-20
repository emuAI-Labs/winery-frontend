export type OutboxStatus = 'pending' | 'syncing' | 'conflict' | 'blocked';

export type OfflinePolicyName =
  | 'network-only'
  | 'queue-blind'
  | 'queue-with-echo';

export interface OutboxIssue {
  id: string;
  method: string;
  path: string;
  status: OutboxStatus;
  createdAt: number;
  attemptCount: number;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
}

export type ConnectivityState = 'online' | 'offline';

export interface SyncStatus {
  connectivity: ConnectivityState;
  outboxPendingCount: number;
  outboxIssueCount: number;
  /** epoch ms of the most recent cached read served while offline, for the
   * "data as of HH:MM" banner */
  lastCachedAt?: number;
}
