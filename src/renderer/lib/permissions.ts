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

const ROLE_RANK: Record<UserRole, number> = {
  waiter: 0,
  bartender: 1,
  supervisor: 2,
  manager: 3,
  owner: 4,
  superadmin: 5,
};

const PERMISSION_MIN_ROLE: Record<InventoryPermission, UserRole> = {
  'inventory:read': 'waiter',
  'inventory:deplete': 'waiter',
  'inventory:loss': 'bartender',
  'inventory:receive': 'supervisor',
  'inventory:transfer': 'supervisor',
  'inventory:count': 'supervisor',
  'inventory:requisition': 'manager',
  'inventory:manage': 'manager',
};

export function hasPermission(
  role: UserRole | undefined,
  permission: InventoryPermission,
): boolean {
  if (!role) return false;
  return ROLE_RANK[role] >= ROLE_RANK[PERMISSION_MIN_ROLE[permission]];
}
