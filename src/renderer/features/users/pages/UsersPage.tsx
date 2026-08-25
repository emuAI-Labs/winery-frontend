import { useState } from 'react';
import { Plus, KeyRound, Pencil, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import PaginationControls from '@/components/ui/pagination-controls';
import QueryState from '@/features/inventory/components/QueryState';
import { formatDateTime } from '@/lib/format';
import { useAuthStore } from '@/store/authStore';
import { hasPermission, manageableRoles } from '@/lib/permissions';
import { AuthUser, UserRole, UserStatus } from '../../../../shared/authTypes';
import { useUsers } from '../hooks/useUsers';
import UserFormDialog from '../components/UserFormDialog';
import UserStatusDialog from '../components/UserStatusDialog';
import ResetPasswordDialog from '../components/ResetPasswordDialog';

const ROLE_LABEL: Record<UserRole, string> = {
  superadmin: 'Superadmin',
  owner: 'Owner',
  manager: 'Manager',
  supervisor: 'Supervisor',
  bartender: 'Bartender',
  waiter: 'Waiter',
};

const STATUS_LABEL: Record<UserStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
  disabled: 'Disabled',
};

const STATUS_BADGE: Record<UserStatus, 'success' | 'warning' | 'secondary'> = {
  active: 'success',
  suspended: 'warning',
  disabled: 'secondary',
};

const LIMIT = 25;

export default function UsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const canCreate = hasPermission(currentUser?.role, 'users:create');
  const canUpdate = hasPermission(currentUser?.role, 'users:update');
  const canDeactivate = hasPermission(currentUser?.role, 'users:deactivate');
  const canResetPassword = hasPermission(
    currentUser?.role,
    'users:reset-password',
  );
  const canManageAnyRow = canUpdate || canDeactivate || canResetPassword;
  const manageable = manageableRoles(currentUser?.role);

  const [role, setRole] = useState<UserRole | 'all'>('all');
  const [status, setStatus] = useState<UserStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);

  const [formUser, setFormUser] = useState<AuthUser | null | undefined>(
    undefined,
  );
  const [statusUser, setStatusUser] = useState<AuthUser | null>(null);
  const [resetUser, setResetUser] = useState<AuthUser | null>(null);

  const { data, isLoading, error } = useUsers({
    role: role === 'all' ? undefined : role,
    status: status === 'all' ? undefined : status,
    search: search || undefined,
    limit: LIMIT,
    offset,
  });

  const canManageRow = (row: AuthUser) => manageable.includes(row.role);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Staff accounts</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage waiter, bartender, supervisor, and manager logins.
            You can only manage roles below your own.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setFormUser(null)}>
            <Plus className="mr-1 h-4 w-4" /> Add staff account
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="userSearch">Search</Label>
          <Input
            id="userSearch"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            placeholder="Name, username, employee code"
            className="w-64"
          />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <Select
            value={role}
            onValueChange={(v) => {
              setRole(v as UserRole | 'all');
              setOffset(0);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {(Object.keys(ROLE_LABEL) as UserRole[]).map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABEL[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as UserStatus | 'all');
              setOffset(0);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(STATUS_LABEL) as UserStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={(data?.items.length ?? 0) === 0}
        emptyMessage="No matching staff accounts."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last login</TableHead>
              {canManageAnyRow && (
                <TableHead className="text-right">Manage</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.map((row) => {
              const rowManageable = canManageRow(row);
              const isSelf = row.id === currentUser?.id;
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="font-medium">{row.fullName}</div>
                    {row.employeeCode && (
                      <div className="text-xs text-muted-foreground">
                        {row.employeeCode}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.username}
                  </TableCell>
                  <TableCell className="capitalize">
                    {ROLE_LABEL[row.role]}
                  </TableCell>
                  <TableCell>{row.branch ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[row.status]}>
                      {STATUS_LABEL[row.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.lastLoginAt ? formatDateTime(row.lastLoginAt) : '—'}
                  </TableCell>
                  {canManageAnyRow && (
                    <TableCell className="text-right">
                      {rowManageable ? (
                        <div className="flex justify-end gap-1">
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit"
                              onClick={() => setFormUser(row)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canResetPassword && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Reset password"
                              onClick={() => setResetUser(row)}
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                          )}
                          {canDeactivate && !isSelf && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Change status"
                              onClick={() => setStatusUser(row)}
                            >
                              <ShieldOff className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {isSelf ? 'This is you' : '—'}
                        </span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </QueryState>

      {data && (
        <PaginationControls
          offset={offset}
          limit={LIMIT}
          total={data.total}
          onOffsetChange={setOffset}
        />
      )}

      <UserFormDialog
        open={formUser !== undefined}
        onOpenChange={(o) => !o && setFormUser(undefined)}
        user={formUser}
      />
      <UserStatusDialog
        open={!!statusUser}
        onOpenChange={(o) => !o && setStatusUser(null)}
        user={statusUser}
      />
      <ResetPasswordDialog
        open={!!resetUser}
        onOpenChange={(o) => !o && setResetUser(null)}
        user={resetUser}
      />
    </div>
  );
}
