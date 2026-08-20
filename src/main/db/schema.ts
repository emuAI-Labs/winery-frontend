/** Single-file schema, run once at startup via `CREATE TABLE IF NOT EXISTS`.
 * No migration framework — this is a new feature with no prior local data. */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS response_cache (
  cache_key TEXT PRIMARY KEY,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  query TEXT,
  data TEXT NOT NULL,
  cached_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  body TEXT,
  policy TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at INTEGER,
  last_error_code TEXT,
  last_error_message TEXT,
  echo_local_ids TEXT
);

CREATE INDEX IF NOT EXISTS idx_outbox_status_created
  ON outbox (status, created_at);

CREATE TABLE IF NOT EXISTS local_id_map (
  local_id TEXT PRIMARY KEY,
  server_id TEXT,
  resolved_at INTEGER
);
`;
