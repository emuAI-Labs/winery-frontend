import crypto from 'crypto';
import { getDb } from './connection';

/** Flat, generic cache of GET responses keyed by request signature — not a
 * relational mirror of every domain entity (~15+ tables), which would be a
 * large, bug-prone lift for this pass. Known limitation, stated explicitly:
 * an offline filter/search combination never seen while online has nothing
 * to fall back to. */
export function cacheKey(
  method: string,
  requestPath: string,
  query?: Record<string, unknown>,
): string {
  const normalizedQuery = query
    ? Object.keys(query)
        .filter((k) => query[k] !== undefined)
        .sort()
        .map((k) => `${k}=${String(query[k])}`)
        .join('&')
    : '';
  return crypto
    .createHash('sha256')
    .update(`${method}|${requestPath}|${normalizedQuery}`)
    .digest('hex');
}

export interface CachedEntry {
  data: unknown;
  cachedAt: number;
}

export function getCached(key: string): CachedEntry | null {
  const row = getDb()
    .prepare('SELECT data, cached_at FROM response_cache WHERE cache_key = ?')
    .get(key) as { data: string; cached_at: number } | undefined;
  if (!row) return null;
  return { data: JSON.parse(row.data), cachedAt: row.cached_at };
}

/** Returns every cached response for a given path regardless of query
 * string — used by echo builders that need "whatever menu list we last saw"
 * rather than an exact query match (e.g. price-estimating a new order line
 * from whichever cached GET /menu/items response is freshest). */
export function findByPath(requestPath: string): CachedEntry[] {
  const rows = getDb()
    .prepare(
      'SELECT data, cached_at FROM response_cache WHERE path = ? ORDER BY cached_at DESC',
    )
    .all(requestPath) as { data: string; cached_at: number }[];
  return rows.map((row) => ({
    data: JSON.parse(row.data),
    cachedAt: row.cached_at,
  }));
}

/** Every cached row, path + parsed data only — used sparingly by echo
 * builders that need to search across cached entries (e.g. "which cached
 * order contains this bill id") rather than look up by exact key. Cache
 * size for a single-branch till is small enough that a full scan is fine. */
export function findAllCached(): { path: string; data: unknown }[] {
  const rows = getDb()
    .prepare('SELECT path, data FROM response_cache')
    .all() as {
    path: string;
    data: string;
  }[];
  return rows.map((row) => ({ path: row.path, data: JSON.parse(row.data) }));
}

export function putCached(
  key: string,
  method: string,
  requestPath: string,
  query: Record<string, unknown> | undefined,
  data: unknown,
): void {
  getDb()
    .prepare(
      `INSERT INTO response_cache (cache_key, method, path, query, data, cached_at)
       VALUES (@key, @method, @path, @query, @data, @cachedAt)
       ON CONFLICT(cache_key) DO UPDATE SET data = @data, cached_at = @cachedAt`,
    )
    .run({
      key,
      method,
      path: requestPath,
      query: query ? JSON.stringify(query) : null,
      data: JSON.stringify(data),
      cachedAt: Date.now(),
    });
}
