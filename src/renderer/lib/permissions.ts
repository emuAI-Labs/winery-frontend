import { UserRole } from '../../shared/authTypes';

export type InventoryPermission =
  | 'inventory:read'
  | 'inventory:deplete'
  | 'inventory:receive'
  | 'inventory:loss'
  | 'inventory:transfer'
  | 'inventory:count'
  | 'inventory:requisition'
  | 'inventory:manage';

export type SalesPermission =
  | 'sales:create'
  | 'sales:manage'
  | 'sales:void'
  | 'sales:discount'
  | 'payments:record'
  | 'payments:confirm-mpesa'
  | 'shifts:open'
  | 'shifts:close'
  | 'shifts:read'
  | 'expenses:read'
  | 'expenses:manage'
  | 'reports:read'
  | 'reports:manage'
  | 'sync:manage';

export type AssetsPermission =
  | 'assets:read'
  | 'assets:manage'
  | 'assets:report-loss'
  | 'maintenance:read'
  | 'maintenance:manage'
  | 'audit:read';

export type UsersPermission =
  | 'users:read'
  | 'users:create'
  | 'users:update'
  | 'users:deactivate'
  | 'users:reset-password';

export type Permission =
  | InventoryPermission
  | SalesPermission
  | AssetsPermission
  | UsersPermission;

const ROLE_RANK: Record<UserRole, number> = {
  waiter: 0,
  bartender: 1,
  supervisor: 2,
  manager: 3,
  owner: 4,
  superadmin: 5,
};

const PERMISSION_MIN_ROLE: Record<Permission, UserRole> = {
  'inventory:read': 'waiter',
  'inventory:deplete': 'waiter',
  'inventory:loss': 'bartender',
  'inventory:receive': 'supervisor',
  'inventory:transfer': 'supervisor',
  'inventory:count': 'supervisor',
  'inventory:requisition': 'manager',
  'inventory:manage': 'manager',

  'sales:create': 'waiter',
  'sales:manage': 'waiter',
  'payments:record': 'waiter',
  'shifts:open': 'waiter',
  'shifts:close': 'waiter',
  'sales:void': 'supervisor',
  'sales:discount': 'supervisor',
  'payments:confirm-mpesa': 'supervisor',
  'shifts:read': 'supervisor',
  'expenses:read': 'supervisor',
  'expenses:manage': 'manager',
  'reports:read': 'manager',
  'reports:manage': 'manager',
  'sync:manage': 'manager',

  'assets:read': 'supervisor',
  'assets:report-loss': 'bartender',
  'assets:manage': 'manager',
  'maintenance:read': 'supervisor',
  'maintenance:manage': 'supervisor',
  'audit:read': 'manager',

  // Mirrors the backend's ROLE_MANAGEABLE_ROLES gate (src/config/rbac.ts in
  // winery-pos-backend): supervisors can view staff but not manage any of
  // them, so users:read sits a rank below the create/update/deactivate/
  // reset-password group. The backend re-checks all of this server-side —
  // this is UI convenience only, see manageableRoles() below.
  'users:read': 'supervisor',
  'users:create': 'manager',
  'users:update': 'manager',
  'users:deactivate': 'manager',
  'users:reset-password': 'manager',
};

export function hasPermission(
  role: UserRole | undefined,
  permission: Permission,
): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[PERMISSION_MIN_ROLE[permission]];
}

/** Which roles `actorRole` is allowed to create/edit/deactivate/reset —
 * strictly below it in the hierarchy, per the backend's
 * ROLE_MANAGEABLE_ROLES. 'superadmin' is never assignable through the API
 * regardless of actor (seed-only), so it's excluded even for a superadmin
 * actor. Used to populate the role picker and to hide manage actions on
 * rows the actor isn't allowed to touch — the backend enforces the real
 * rule on every mutating call regardless. */
export function manageableRoles(actorRole: UserRole | undefined): UserRole[] {
  if (!actorRole) return [];
  const ALL_MANAGEABLE: UserRole[] = [
    'owner',
    'manager',
    'supervisor',
    'bartender',
    'waiter',
  ];
  const actorRank = ROLE_RANK[actorRole];
  return ALL_MANAGEABLE.filter((role) => ROLE_RANK[role] < actorRank);
}
