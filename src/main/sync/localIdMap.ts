import crypto from 'crypto';
import { getDb } from '../db/connection';

const LOCAL_PREFIX = 'local-';

export function mintLocalId(): string {
  return `${LOCAL_PREFIX}${crypto.randomUUID()}`;
}

export function isLocalToken(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(LOCAL_PREFIX);
}

export function recordMapping(localId: string, serverId: string): void {
  getDb()
    .prepare(
      `INSERT INTO local_id_map (local_id, server_id, resolved_at) VALUES (@localId, @serverId, @now)
       ON CONFLICT(local_id) DO UPDATE SET server_id = @serverId, resolved_at = @now`,
    )
    .run({ localId, serverId, now: Date.now() });
}

export function resolve(localId: string): string | undefined {
  const row = getDb()
    .prepare('SELECT server_id FROM local_id_map WHERE local_id = ?')
    .get(localId) as { server_id: string | null } | undefined;
  return row?.server_id ?? undefined;
}

/** True once some local id has already been mapped to this server id —
 * used to tell "a real record we already attributed to an earlier synced
 * item" apart from "the real record this sync just produced." */
export function hasResolvedTo(serverId: string): boolean {
  const row = getDb()
    .prepare('SELECT 1 FROM local_id_map WHERE server_id = ?')
    .get(serverId);
  return !!row;
}

/** Walks a path string for `local-<uuid>` tokens (path segments are split on
 * '/'), substituting any that are now resolved. Returns tokens still
 * unresolved so the drain loop can decide pending vs blocked. */
export function resolveInPath(pathValue: string): {
  path: string;
  unresolved: string[];
} {
  const unresolved: string[] = [];
  const segments = pathValue.split('/').map((segment) => {
    if (!isLocalToken(segment)) return segment;
    const resolved = resolve(segment);
    if (resolved) return resolved;
    unresolved.push(segment);
    return segment;
  });
  return { path: segments.join('/'), unresolved };
}

function walk(value: unknown, unresolved: string[]): unknown {
  if (isLocalToken(value)) {
    const resolved = resolve(value);
    if (resolved) return resolved;
    unresolved.push(value);
    return value;
  }
  if (Array.isArray(value)) return value.map((v) => walk(v, unresolved));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        walk(v, unresolved),
      ]),
    );
  }
  return value;
}

export function resolveInBody(body: unknown): {
  body: unknown;
  unresolved: string[];
} {
  const unresolved: string[] = [];
  const resolved = walk(body, unresolved);
  return { body: resolved, unresolved };
}
