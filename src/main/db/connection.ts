import path from 'path';
import Database from 'better-sqlite3';
import { app } from 'electron';
import { SCHEMA_SQL } from './schema';

let db: Database.Database | null = null;

/** Lazy singleton — one SQLite file per install, WAL mode for crash-safety
 * (outbox status transitions are only ever visible once committed, so an
 * app kill mid-sync just resumes cleanly on next launch). */
export function getDb(): Database.Database {
  if (db) return db;
  const dbPath = path.join(app.getPath('userData'), 'winery.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA_SQL);
  return db;
}
