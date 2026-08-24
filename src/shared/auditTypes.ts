/** The backend enumerates ~65 audit actions (asset.*, reusable_asset.*,
 * maintenance.*, inventory.*, sale.*, shift.*, expense.*, ...). Typing
 * every one here would drift out of sync with the backend's own enum, so
 * this stays a plain string — the filter dropdown only needs a short,
 * curated subset a manager would actually search for. */
export type AuditAction = string;

export interface AuditLogRow {
  id: string;
  action: AuditAction;
  actorId: string | null;
  actorUsername: string | null;
  actorRole: string | null;
  targetId: string | null;
  targetUsername: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  sessionId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export const COMMON_AUDIT_ACTIONS: AuditAction[] = [
  'asset.created',
  'asset.updated',
  'asset.disposed',
  'reusable_asset.received',
  'reusable_asset.loss_reported',
  'reusable_asset.adjusted',
  'maintenance.scheduled',
  'maintenance.logged',
  'sale.void',
  'sale.discount',
  'inventory.adjustment',
  'shift.opened',
  'shift.closed',
];
