import { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { hasPermission, InventoryPermission } from '@/lib/permissions';

interface RequirePermissionProps {
  permission: InventoryPermission;
  children: ReactElement;
}

/** Route-level RBAC gate for screens whose access hinges on a specific
 * inventory:* permission rather than a role list — a direct URL visit (not
 * just a hidden nav link) must not be enough to reach a screen you can't use. */
export default function RequirePermission({
  permission,
  children,
}: RequirePermissionProps) {
  const role = useAuthStore((s) => s.user?.role);
  if (!hasPermission(role, permission))
    return <Navigate to="/inventory" replace />;
  return children;
}
