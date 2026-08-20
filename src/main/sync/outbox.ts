import crypto from 'crypto';
import { getDb } from '../db/connection';
import { AuthError } from '../../shared/authTypes';
import {
  OfflinePolicyName,
  OutboxIssue,
  OutboxStatus,
} from '../../shared/syncTypes';

interface OutboxRow {
  id: string;
  status: OutboxStatus;
  method: string;
  path: string;
  body: string | null;
  policy: OfflinePolicyName;
  created_at: number;
  attempt_count: number;
  last_attempt_at: number | null;
  last_error_code: string | null;
  last_error_message: string | null;
  echo_local_ids: string | null;
}

export interface EnqueueInput {
  method: string;
  path: string;
  body?: unknown;
  policy: OfflinePolicyName;
}

function rowToIssue(row: OutboxRow): OutboxIssue {
  return {
    id: row.id,
    method: row.method,
    path: row.path,
    status: row.status,
    createdAt: row.created_at,
    attemptCount: row.attempt_count,
    lastErrorCode: row.last_error_code,
    lastErrorMessage: row.last_error_message,
  };
}

export function enqueue(item: EnqueueInput): { id: string } {
  const id = crypto.randomUUID();
  getDb()
    .prepare(
      `INSERT INTO outbox (id, status, method, path, body, policy, created_at, attempt_count)
       VALUES (@id, 'pending', @method, @path, @body, @policy, @createdAt, 0)`,
    )
    .run({
      id,
      method: item.method,
      path: item.path,
      body: item.body === undefined ? null : JSON.stringify(item.body),
      policy: item.policy,
      createdAt: Date.now(),
    });
  return { id };
}

export function setEchoLocalIds(id: string, localIds: string[]): void {
  if (localIds.length === 0) return;
  getDb()
    .prepare('UPDATE outbox SET echo_local_ids = ? WHERE id = ?')
    .run(JSON.stringify(localIds), id);
}

export function getEchoLocalIds(id: string): string[] {
  const row = getDb()
    .prepare('SELECT echo_local_ids FROM outbox WHERE id = ?')
    .get(id) as { echo_local_ids: string | null } | undefined;
  return row?.echo_local_ids
    ? (JSON.parse(row.echo_local_ids) as string[])
    : [];
}

/** FIFO order — a parent create is always enqueued before requests that
 * depend on it, so strict creation-order processing preserves dependency
 * order without needing an explicit dependency graph. */
export function listReplayable(): OutboxRow[] {
  return getDb()
    .prepare(
      `SELECT * FROM outbox WHERE status IN ('pending', 'blocked') ORDER BY created_at ASC`,
    )
    .all() as OutboxRow[];
}

export function listIssues(): OutboxIssue[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM outbox WHERE status = 'conflict' ORDER BY created_at ASC`,
    )
    .all() as OutboxRow[];
  return rows.map(rowToIssue);
}

export function listBlocked(): OutboxIssue[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM outbox WHERE status = 'blocked' ORDER BY created_at ASC`,
    )
    .all() as OutboxRow[];
  return rows.map(rowToIssue);
}

export function countPending(): number {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS n FROM outbox WHERE status IN ('pending', 'syncing', 'blocked')`,
    )
    .get() as { n: number };
  return row.n;
}

export function countIssues(): number {
  const row = getDb()
    .prepare(`SELECT COUNT(*) AS n FROM outbox WHERE status = 'conflict'`)
    .get() as { n: number };
  return row.n;
}

export function isEmpty(): boolean {
  return countPending() === 0;
}

export function markSyncing(id: string): void {
  getDb().prepare(`UPDATE outbox SET status = 'syncing' WHERE id = ?`).run(id);
}

export function markSucceeded(id: string): void {
  getDb().prepare('DELETE FROM outbox WHERE id = ?').run(id);
}

export function markRetryable(id: string, error: AuthError): void {
  getDb()
    .prepare(
      `UPDATE outbox SET status = 'pending', attempt_count = attempt_count + 1,
       last_attempt_at = @now, last_error_code = @code, last_error_message = @message
       WHERE id = @id`,
    )
    .run({ id, now: Date.now(), code: error.code, message: error.message });
}

export function markConflict(id: string, error: AuthError): void {
  getDb()
    .prepare(
      `UPDATE outbox SET status = 'conflict', attempt_count = attempt_count + 1,
       last_attempt_at = @now, last_error_code = @code, last_error_message = @message
       WHERE id = @id`,
    )
    .run({ id, now: Date.now(), code: error.code, message: error.message });
}

export function markBlocked(id: string): void {
  getDb().prepare(`UPDATE outbox SET status = 'blocked' WHERE id = ?`).run(id);
}

export function discardIssue(id: string): void {
  getDb().prepare('DELETE FROM outbox WHERE id = ?').run(id);
}

export function retryIssue(id: string): void {
  getDb().prepare(`UPDATE outbox SET status = 'pending' WHERE id = ?`).run(id);
}
