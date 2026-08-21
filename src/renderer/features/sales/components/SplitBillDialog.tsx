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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError } from '@/lib/apiClient';
import { formatCents } from '@/lib/format';
import { Order } from '../../../../shared/salesTypes';
import { useSplitBill } from '../hooks/useBills';
import { useMenuItemLookup } from '../hooks/useMenuItemLookup';

interface SplitBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
}

type Mode = 'by_item' | 'by_seat' | 'even';

export default function SplitBillDialog({
  open,
  onOpenChange,
  order,
}: SplitBillDialogProps) {
  const splitBill = useSplitBill(order.id);
  const menuItemNames = useMenuItemLookup();
  const [mode, setMode] = useState<Mode>('by_item');
  const [guestCount, setGuestCount] = useState('2');
  const [error, setError] = useState<string | null>(null);

  const activeLines = order.lines.filter((l) => l.status !== 'void');
  const [assignments, setAssignments] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!open) return;
    setMode('by_item');
    setGuestCount('2');
    setError(null);
    setAssignments(Object.fromEntries(activeLines.map((l) => [l.id, 1])));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only on open
  }, [open]);

  const groupCount = Math.max(0, ...Object.values(assignments), 1);

  const handleSubmit = async () => {
    setError(null);
    try {
      if (mode === 'by_item') {
        const groups: string[][] = Array.from({ length: groupCount }, () => []);
        activeLines.forEach((line) => {
          const g = assignments[line.id] ?? 1;
          groups[g - 1].push(line.id);
        });
        if (groups.some((g) => g.length === 0)) {
          setError(
            'Every group needs at least one item — remove unused groups.',
          );
          return;
        }
        await splitBill.mutateAsync({ mode: 'by_item', groups });
      } else if (mode === 'by_seat') {
        await splitBill.mutateAsync({ mode: 'by_seat' });
      } else {
        const n = parseInt(guestCount, 10);
        if (!n || n < 2) {
          setError('Enter at least 2 guests.');
          return;
        }
        await splitBill.mutateAsync({ mode: 'even', guestCount: n });
      }
      toast.success('Bill split');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Split bill</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="by_item">By item</TabsTrigger>
              <TabsTrigger value="by_seat">By seat</TabsTrigger>
              <TabsTrigger value="even">Evenly</TabsTrigger>
            </TabsList>
          </Tabs>

          {mode === 'by_item' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Assign each item to a bill group — every item must go somewhere.
              </p>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {activeLines.map((line) => (
                  <div
                    key={line.id}
                    className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"
                  >
                    <span>
                      {line.quantity}×{' '}
                      {menuItemNames.get(line.menuItemId) ?? line.menuItemId}{' '}
                      <span className="text-muted-foreground">
                        ({formatCents(line.lineTotalCents)})
                      </span>
                    </span>
                    <Select
                      value={String(assignments[line.id] ?? 1)}
                      onValueChange={(v) =>
                        setAssignments((prev) => ({
                          ...prev,
                          [line.id]: Number(v),
                        }))
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          { length: activeLines.length },
                          (_, i) => i + 1,
                        ).map((g) => (
                          <SelectItem key={g} value={String(g)}>
                            Bill {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === 'by_seat' && (
            <p className="text-sm text-muted-foreground">
              Groups lines automatically by each line&apos;s seat label. Lines
              with no seat set are grouped as &quot;Unassigned&quot;. Needs at
              least two distinct seats present.
            </p>
          )}

          {mode === 'even' && (
            <div className="space-y-2">
              <Label htmlFor="guestCount">Number of guests</Label>
              <Input
                id="guestCount"
                type="number"
                min="2"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Divides the total evenly; shares always sum exactly to the
                total. Items stay attached to the first resulting bill — the
                others exist purely to take payment for their share.
              </p>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={splitBill.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={splitBill.isPending}>
            {splitBill.isPending ? 'Splitting…' : 'Split'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
