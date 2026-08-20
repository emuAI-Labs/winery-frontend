import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError } from '@/lib/apiClient';
import { useBranches } from '@/context/BranchContext';
import { useAllItems } from '../hooks/useAllItems';
import { useCreateTransfer } from '../hooks/useTransfers';
import ItemPicker from './ItemPicker';

interface TransferFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DraftLine = { key: string; itemId: string | null; quantity: string };
let keyCounter = 0;
const newLine = (): DraftLine => {
  keyCounter += 1;
  return { key: `line-${keyCounter}`, itemId: null, quantity: '' };
};

export default function TransferFormDialog({
  open,
  onOpenChange,
}: TransferFormDialogProps) {
  const { branches, selectedBranchId } = useBranches();
  const { items } = useAllItems();
  const createTransfer = useCreateTransfer();

  const [fromBranchId, setFromBranchId] = useState('');
  const [toBranchId, setToBranchId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([newLine()]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setFromBranchId(selectedBranchId ?? '');
    setToBranchId('');
    setNotes('');
    setLines([newLine()]);
    setError(null);
  }, [open, selectedBranchId]);

  const chosenIds = lines.map((l) => l.itemId).filter((v): v is string => !!v);

  const handleSubmit = async () => {
    setError(null);
    if (!fromBranchId || !toBranchId) {
      setError('Choose both a source and a destination branch.');
      return;
    }
    if (fromBranchId === toBranchId) {
      setError('Source and destination branches must be different.');
      return;
    }
    const validLines = lines.filter(
      (l) => l.itemId && parseFloat(l.quantity) > 0,
    );
    if (validLines.length === 0) {
      setError('Add at least one item and quantity.');
      return;
    }
    try {
      await createTransfer.mutateAsync({
        fromBranchId,
        toBranchId,
        notes: notes || undefined,
        lines: validLines.map((l) => ({
          itemId: l.itemId as string,
          quantity: parseFloat(l.quantity),
        })),
      });
      toast.success('Transfer requested');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New transfer request</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>From branch</Label>
              <Select value={fromBranchId} onValueChange={setFromBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>To branch</Label>
              <Select value={toBranchId} onValueChange={setToBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="Destination" />
                </SelectTrigger>
                <SelectContent>
                  {branches
                    .filter((b) => b.id !== fromBranchId)
                    .map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Items</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setLines((p) => [...p, newLine()])}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add line
              </Button>
            </div>
            {lines.map((line) => (
              <div key={line.key} className="flex items-end gap-2">
                <div className="flex-1">
                  <ItemPicker
                    items={items}
                    value={line.itemId}
                    onChange={(id) =>
                      setLines((p) =>
                        p.map((l) =>
                          l.key === line.key ? { ...l, itemId: id } : l,
                        ),
                      )
                    }
                    excludeIds={chosenIds}
                  />
                </div>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-28"
                  placeholder="Qty"
                  value={line.quantity}
                  onChange={(e) =>
                    setLines((p) =>
                      p.map((l) =>
                        l.key === line.key
                          ? { ...l, quantity: e.target.value }
                          : l,
                      ),
                    )
                  }
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setLines((p) => p.filter((l) => l.key !== line.key))
                  }
                  disabled={lines.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transferNotes">Notes (optional)</Label>
            <Textarea
              id="transferNotes"
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
            disabled={createTransfer.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createTransfer.isPending}>
            {createTransfer.isPending ? 'Requesting…' : 'Request transfer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
