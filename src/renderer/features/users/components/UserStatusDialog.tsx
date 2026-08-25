import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError } from '@/lib/apiClient';
import { AuthUser, UserStatus } from '../../../../shared/authTypes';
import { useSetUserStatus } from '../hooks/useUsers';

const STATUS_LABEL: Record<UserStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
  disabled: 'Disabled',
};

interface UserStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AuthUser | null;
}

export default function UserStatusDialog({
  open,
  onOpenChange,
  user,
}: UserStatusDialogProps) {
  const setStatus = useSetUserStatus();
  const [status, setStatusValue] = useState<UserStatus>('suspended');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStatusValue(user?.status === 'active' ? 'suspended' : 'active');
    setReason('');
    setError(null);
  }, [open, user]);

  const handleSubmit = async () => {
    if (!user) return;
    setError(null);
    try {
      await setStatus.mutateAsync({ id: user.id, status, reason });
      toast.success(
        `${user.fullName} is now ${STATUS_LABEL[status].toLowerCase()}`,
      );
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Change status{user ? ` — ${user.fullName}` : ''}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>New status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatusValue(v as UserStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_LABEL) as UserStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="statusReason">Reason (optional)</Label>
            <Textarea
              id="statusReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={setStatus.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={setStatus.isPending}>
            {setStatus.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
