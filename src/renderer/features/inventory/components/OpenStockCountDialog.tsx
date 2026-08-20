import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { ApiError } from '@/lib/apiClient';
import { useBranches } from '@/context/BranchContext';
import { useAllItems } from '../hooks/useAllItems';
import { useOpenStockCount } from '../hooks/useStockCounts';
import { useRecentStockCounts } from '../hooks/useRecentStockCounts';
import ItemPicker from './ItemPicker';

interface OpenStockCountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OpenStockCountDialog({
  open,
  onOpenChange,
}: OpenStockCountDialogProps) {
  const { selectedBranchId } = useBranches();
  const { items } = useAllItems(selectedBranchId ?? undefined);
  const openCount = useOpenStockCount();
  const { record } = useRecentStockCounts(selectedBranchId ?? undefined);
  const navigate = useNavigate();

  const [mode, setMode] = useState<'full' | 'cycle'>('full');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setMode('full');
    setSelectedItemIds([]);
    setNotes('');
    setError(null);
  }, [open]);

  const handleSubmit = async () => {
    setError(null);
    if (!selectedBranchId) {
      setError('Select a branch first.');
      return;
    }
    if (mode === 'cycle' && selectedItemIds.length === 0) {
      setError('Add at least one item for a cycle count.');
      return;
    }
    try {
      const count = await openCount.mutateAsync({
        branchId: selectedBranchId,
        itemIds: mode === 'cycle' ? selectedItemIds : undefined,
        notes: notes || undefined,
      });
      record({
        id: count.id,
        branchId: selectedBranchId,
        openedAt: new Date().toISOString(),
      });
      toast.success('Stock count opened');
      onOpenChange(false);
      navigate(`/inventory/stock-counts/${count.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a stock count</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === 'full' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('full')}
            >
              Full stocktake
            </Button>
            <Button
              type="button"
              variant={mode === 'cycle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('cycle')}
            >
              Cycle count (some items)
            </Button>
          </div>

          {mode === 'full' ? (
            <p className="text-sm text-muted-foreground">
              Snapshots every item currently stocked at this branch.
            </p>
          ) : (
            <div className="space-y-2">
              <Label>Items to count</Label>
              <ItemPicker
                items={items}
                value={null}
                onChange={(id) =>
                  setSelectedItemIds((prev) => [...new Set([...prev, id])])
                }
                excludeIds={selectedItemIds}
              />
              <div className="flex flex-wrap gap-1">
                {selectedItemIds.map((id) => {
                  const item = items.find((i) => i.id === id);
                  return (
                    <Badge key={id} variant="secondary" className="gap-1">
                      {item?.name ?? id}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedItemIds((prev) =>
                            prev.filter((v) => v !== id),
                          )
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="countNotes">Notes (optional)</Label>
            <Textarea
              id="countNotes"
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
            disabled={openCount.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={openCount.isPending}>
            {openCount.isPending ? 'Opening…' : 'Open count'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
