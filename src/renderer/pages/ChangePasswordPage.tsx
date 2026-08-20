import { useState, FormEvent } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/authStore';
import describeAuthError from '@/lib/authErrors';

const newPasswordSchema = z
  .string()
  .min(10, 'Must be at least 10 characters')
  .max(128, 'Must be at most 128 characters')
  .regex(/[a-z]/, 'Must include a lowercase letter')
  .regex(/[A-Z]/, 'Must include an uppercase letter')
  .regex(/[0-9]/, 'Must include a digit');

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const changePassword = useAuthStore((s) => s.changePassword);
  const logout = useAuthStore((s) => s.logout);
  const lastError = useAuthStore((s) => s.lastError);
  const clearError = useAuthStore((s) => s.clearError);
  const user = useAuthStore((s) => s.user);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (newPassword !== confirmPassword) {
      setLocalError('New password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setLocalError(
        'New password must be different from your current password.',
      );
      return;
    }
    const parsed = newPasswordSchema.safeParse(newPassword);
    if (!parsed.success) {
      setLocalError(parsed.error.issues[0]?.message ?? 'Invalid password.');
      return;
    }

    setSubmitting(true);
    await changePassword(currentPassword, newPassword);
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>
            {user
              ? `Hi ${user.fullName}, you need to set a new password before continuing.`
              : 'You need to set a new password before continuing.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                autoFocus
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                At least 10 characters, with an uppercase letter, a lowercase
                letter, and a digit.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
            {(localError || lastError) && (
              <Alert variant="destructive">
                <AlertDescription>
                  {localError || (lastError && describeAuthError(lastError))}
                </AlertDescription>
              </Alert>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={
                submitting ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              {submitting ? 'Saving…' : 'Save new password'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={submitting}
              onClick={() => logout()}
            >
              Sign in as someone else
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
