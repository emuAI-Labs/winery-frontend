/* eslint-disable react/require-default-props -- `roles` is genuinely optional; no defaultProps needed on a function component */
import { PropsWithChildren, ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '../../../shared/authTypes';

interface RequireAuthProps extends PropsWithChildren {
  roles?: UserRole[];
}

/** Gates a route on sign-in state, and optionally on role. The backend is
 * always the real gate (a 403 there is expected and handled), this is just
 * UI-level convenience so unauthorized staff never see admin screens. */
export default function RequireAuth({
  roles,
  children,
}: RequireAuthProps): ReactElement {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status === 'signedOut') return <Navigate to="/login" replace />;
  if (status === 'needsPasswordChange') {
    return <Navigate to="/change-password" replace />;
  }
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children as ReactElement;
}
