import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ApiError } from '@/lib/apiClient';
import { formatCents } from '@/lib/format';
import { Shift } from '../../../../shared/salesTypes';
import { useCloseShift } from '../hooks/useShifts';

interface CloseShiftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift: Shift | null;
}

export default function CloseShiftDialog({
  open,
  onOpenChange,
  shift,
}: CloseShiftDialogProps) {
  const closeShift = useCloseShift();
  const [countedCash, setCountedCash] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Shift | null>(null);

  useEffect(() => {
    if (!open) return;
    setCountedCash('');
    setNotes('');
    setError(null);
    setResult(null);
  }, [open]);

  if (!shift) return null;

  const handleSubmit = async () => {
    setError(null);
    if (!countedCash) {
      setError('Enter the counted cash amount.');
      return;
    }
    try {
      const res = await closeShift.mutateAsync({
        id: shift.id,
        countedCashCents: Math.round(parseFloat(countedCash) * 100),
        notes: notes || undefined,
      });
      setResult(res.shift);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (result) toast.success('Shift closed');
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close shift — cash up</DialogTitle>
          {!result && (
            <DialogDescription>
              Count the drawer now and enter the total. This does not affect
              card or M-PESA takings, only cash.
            </DialogDescription>
          )}
        </DialogHeader>

        {result ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 rounded-md border p-4 text-sm">
              <span className="text-muted-foreground">Expected cash</span>
              <span className="text-right">
                {formatCents(result.expectedCashCents)}
              </span>
              <span className="text-muted-foreground">Counted cash</span>
              <span className="text-right">
                {formatCents(result.countedCashCents)}
              </span>
              <span className="text-muted-foreground">Variance</span>
              <span className="text-right">
                <Badge
                  variant={
                    (result.varianceCents ?? 0) < 0 ? 'destructive' : 'success'
                  }
                >
                  {(result.varianceCents ?? 0) >= 0 ? '+' : ''}
                  {formatCents(result.varianceCents)}
                </Badge>
              </span>
            </div>
            {(result.varianceCents ?? 0) < 0 && (
              <p className="text-sm text-destructive">
                Drawer is short — this is worth investigating before the next
                shift starts.
              </p>
            )}
            <Button className="w-full" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="countedCash">Counted cash in drawer</Label>
                <Input
                  id="countedCash"
                  type="number"
                  min="0"
                  step="0.01"
                  autoFocus
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closeNotes">Notes (optional)</Label>
                <Textarea
                  id="closeNotes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={closeShift.isPending}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={closeShift.isPending}>
                {closeShift.isPending ? 'Closing…' : 'Close shift'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
