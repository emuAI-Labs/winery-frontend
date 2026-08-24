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

export type Permission = InventoryPermission | SalesPermission | AssetsPermission;

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
};

export function hasPermission(
  role: UserRole | undefined,
  permission: Permission,
): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[PERMISSION_MIN_ROLE[permission]];
}
