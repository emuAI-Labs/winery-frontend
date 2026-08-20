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
import { Checkbox } from '@/components/ui/checkbox';
import { ApiError } from '@/lib/apiClient';
import { formatCents } from '@/lib/format';
import { Order } from '../../../../shared/salesTypes';
import { useJoinBills } from '../hooks/useBills';

interface JoinBillsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

export default function JoinBillsDialog({
  open,
  onOpenChange,
  order,
}: JoinBillsDialogProps) {
  const joinBills = useJoinBills(order.id);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const openBills = order.bills.filter((b) => b.status === 'open');

  useEffect(() => {
    if (!open) return;
    setSelected([]);
    setError(null);
  }, [open]);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );

  const handleSubmit = async () => {
    setError(null);
    if (selected.length < 2) {
      setError('Select at least two open bills to merge.');
      return;
    }
    try {
      await joinBills.mutateAsync(selected);
      toast.success('Bills merged');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge bills</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {openBills.length < 2 && (
            <p className="text-sm text-muted-foreground">
              Need at least two open bills on this order to merge.
            </p>
          )}
          {openBills.map((bill, idx) => (
            // eslint-disable-next-line jsx-a11y/label-has-associated-control -- Checkbox is a button, not a labelable form control
            <label
              key={bill.id}
              className="flex items-center gap-2 rounded-md border p-2 text-sm"
            >
              <Checkbox
                checked={selected.includes(bill.id)}
                onCheckedChange={() => toggle(bill.id)}
              />
              Bill {idx + 1} — {formatCents(bill.totalCents)}
            </label>
          ))}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={joinBills.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={joinBills.isPending || openBills.length < 2}
          >
            {joinBills.isPending ? 'Merging…' : 'Merge selected'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
