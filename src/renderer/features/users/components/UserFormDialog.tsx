import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Copy, Dices, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { manageableRoles } from '@/lib/permissions';
import { AuthUser, UserRole } from '../../../../shared/authTypes';
import { useCreateUser, useUpdateUser } from '../hooks/useUsers';
import generatePassword from '../lib/generatePassword';

const usernameSchema = z
  .string()
  .min(3, 'Must be at least 3 characters')
  .max(64, 'Must be at most 64 characters')
  .regex(/^[\w.-]+$/, 'Only letters, numbers, dots, underscores, and hyphens');

const passwordSchema = z
  .string()
  .min(10, 'Must be at least 10 characters')
  .max(128, 'Must be at most 128 characters')
  .regex(/[a-z]/, 'Must include a lowercase letter')
  .regex(/[A-Z]/, 'Must include an uppercase letter')
  .regex(/[0-9]/, 'Must include a digit');

const ROLE_LABEL: Record<UserRole, string> = {
  superadmin: 'Superadmin',
  owner: 'Owner',
  manager: 'Manager',
  supervisor: 'Supervisor',
  bartender: 'Bartender',
  waiter: 'Waiter',
};

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** present = edit; absent = create */
  user?: AuthUser | null;
}

export default function UserFormDialog({
  open,
  onOpenChange,
  user,
}: UserFormDialogProps) {
  const actorRole = useAuthStore((s) => s.user?.role);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isEdit = !!user;
  const isPending = createUser.isPending || updateUser.isPending;

  const roleOptions = manageableRoles(actorRole);
  // An edited row's current role may not itself be re-assignable (it's
  // shown for context either way) — keep it selectable so saving without
  // touching role never silently fails validation.
  if (user && !roleOptions.includes(user.role)) roleOptions.push(user.role);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('waiter');
  const [fullName, setFullName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [branch, setBranch] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    username: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    setUsername(user?.username ?? '');
    setPassword('');
    setShowPassword(false);
    setRole(user?.role ?? roleOptions[roleOptions.length - 1] ?? 'waiter');
    setFullName(user?.fullName ?? '');
    setEmployeeCode(user?.employeeCode ?? '');
    setPhone(user?.phone ?? '');
    setEmail(user?.email ?? '');
    setBranch(user?.branch ?? '');
    setMustChangePassword(true);
    setError(null);
    setCreated(null);
    // roleOptions is derived fresh each render from actorRole; excluding it
    // avoids resetting the form on every keystroke elsewhere.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  const handleCopyPassword = async () => {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.password);
      toast.success('Password copied');
    } catch {
      toast.error('Could not copy — select and copy it manually.');
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }

    if (isEdit) {
      try {
        await updateUser.mutateAsync({
          id: user.id,
          fullName,
          employeeCode: employeeCode || null,
          phone: phone || null,
          email: email || null,
          branch: branch || null,
          role: role !== user.role ? role : undefined,
        });
        toast.success(
          role !== user.role
            ? `${fullName} updated — signed out of all devices`
            : `${fullName} updated`,
        );
        onOpenChange(false);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : 'Something went wrong.',
        );
      }
      return;
    }

    const usernameCheck = usernameSchema.safeParse(username);
    if (!usernameCheck.success) {
      setError(usernameCheck.error.issues[0]?.message ?? 'Invalid username.');
      return;
    }
    const passwordCheck = passwordSchema.safeParse(password);
    if (!passwordCheck.success) {
      setError(passwordCheck.error.issues[0]?.message ?? 'Invalid password.');
      return;
    }

    try {
      await createUser.mutateAsync({
        username,
        password,
        role,
        fullName,
        employeeCode: employeeCode || undefined,
        phone: phone || undefined,
        email: email || undefined,
        branch: branch || undefined,
        mustChangePassword,
      });
      setCreated({ username, password });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  if (created) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Account created</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                This password is shown once and can&apos;t be retrieved again —
                share it with {fullName} securely now.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={created.username} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex gap-2">
                <Input value={created.password} readOnly />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyPassword}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit staff account' : 'Add staff account'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userFullName">Full name</Label>
              <Input
                id="userFullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Wanjiru"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isEdit && role !== user.role && (
            <Alert variant="warning">
              <AlertDescription>
                Changing this role will sign {user.fullName} out of every
                device.
              </AlertDescription>
            </Alert>
          )}

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="userUsername">Username</Label>
              <Input
                id="userUsername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                placeholder="jwanjiru"
              />
            </div>
          )}

          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="userPassword">Initial password</Label>
              <div className="flex gap-2">
                <Input
                  id="userPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowPassword((v) => !v)}
                  title={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setPassword(generatePassword());
                    setShowPassword(true);
                  }}
                  title="Generate a strong password"
                >
                  <Dices className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                At least 10 characters, with an uppercase letter, a lowercase
                letter, and a digit. You&apos;ll see this once more after saving
                — make sure it reaches them.
              </p>
            </div>
          )}

          {!isEdit && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="mustChangePassword"
                checked={mustChangePassword}
                onCheckedChange={(v) => setMustChangePassword(v === true)}
              />
              <Label htmlFor="mustChangePassword" className="font-normal">
                Require a password change on first login
              </Label>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userEmployeeCode">Employee code (optional)</Label>
              <Input
                id="userEmployeeCode"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userBranch">Branch (optional)</Label>
              <Input
                id="userBranch"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userPhone">Phone (optional)</Label>
              <Input
                id="userPhone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254712345678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userEmail">Email (optional)</Label>
              <Input
                id="userEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
