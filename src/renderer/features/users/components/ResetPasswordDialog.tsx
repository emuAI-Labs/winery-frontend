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
import { ApiError } from '@/lib/apiClient';
import { AuthUser } from '../../../../shared/authTypes';
import { useResetUserPassword } from '../hooks/useUsers';
import generatePassword from '../lib/generatePassword';

const passwordSchema = z
  .string()
  .min(10, 'Must be at least 10 characters')
  .max(128, 'Must be at most 128 characters')
  .regex(/[a-z]/, 'Must include a lowercase letter')
  .regex(/[A-Z]/, 'Must include an uppercase letter')
  .regex(/[0-9]/, 'Must include a digit');

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AuthUser | null;
}

export default function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
}: ResetPasswordDialogProps) {
  const resetPassword = useResetUserPassword();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPassword('');
    setShowPassword(false);
    setMustChangePassword(true);
    setError(null);
    setDone(false);
  }, [open, user]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      toast.success('Password copied');
    } catch {
      toast.error('Could not copy — select and copy it manually.');
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setError(null);
    const check = passwordSchema.safeParse(password);
    if (!check.success) {
      setError(check.error.issues[0]?.message ?? 'Invalid password.');
      return;
    }
    try {
      await resetPassword.mutateAsync({
        id: user.id,
        newPassword: password,
        mustChangePassword,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  if (done) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password reset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                This password is shown once and can&apos;t be retrieved again —
                share it with {user?.fullName} securely now. Every other device
                they were signed in on has been signed out.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label>New password</Label>
              <div className="flex gap-2">
                <Input value={password} readOnly />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
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
            Reset password{user ? ` — ${user.fullName}` : ''}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resetPassword">New password</Label>
            <div className="flex gap-2">
              <Input
                id="resetPassword"
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
              letter, and a digit.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="resetMustChangePassword"
              checked={mustChangePassword}
              onCheckedChange={(v) => setMustChangePassword(v === true)}
            />
            <Label htmlFor="resetMustChangePassword" className="font-normal">
              Require a password change on next login
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            This immediately signs {user?.fullName ?? 'this user'} out of every
            device.
          </p>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={resetPassword.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={resetPassword.isPending}>
            {resetPassword.isPending ? 'Saving…' : 'Reset password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
