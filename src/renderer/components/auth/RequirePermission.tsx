import { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { hasPermission, Permission } from '@/lib/permissions';

interface RequirePermissionProps {
  permission: Permission;
  /** where to bounce an unauthorized visitor; defaults to the till home */
  fallback?: string;
  children: ReactElement;
}

/** Route-level RBAC gate for screens whose access hinges on a specific
 * permission rather than a role list — a direct URL visit (not just a
 * hidden nav link) must not be enough to reach a screen you can't use. */
export default function RequirePermission({
  permission,
  fallback = '/',
  children,
}: RequirePermissionProps) {
  const role = useAuthStore((s) => s.user?.role);
  if (!hasPermission(role, permission))
    return <Navigate to={fallback} replace />;
  return children;
}
