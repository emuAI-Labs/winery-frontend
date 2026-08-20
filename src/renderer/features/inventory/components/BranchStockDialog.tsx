import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/apiClient';
import { useBranches } from '@/context/BranchContext';
import { InventoryItem } from '../../../../shared/inventoryTypes';
import { useSetBranchStockLevels } from '../hooks/useItems';

interface BranchStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
}

/** Sets min/max/reorder-point for one item at the currently selected branch.
 * This is config only — it never touches quantity on hand. Calling it for a
 * never-stocked item+branch pair creates the stock row at zero, which is
 * how you "activate" an item at a branch before its first delivery. */
export default function BranchStockDialog({
  open,
  onOpenChange,
  item,
}: BranchStockDialogProps) {
  const { selectedBranchId, branches } = useBranches();
  const setLevels = useSetBranchStockLevels();
  const [minLevel, setMinLevel] = useState('');
  const [maxLevel, setMaxLevel] = useState('');
  const [reorderPoint, setReorderPoint] = useState('');
  const [error, setError] = useState<string | null>(null);

  const branchName = branches.find((b) => b.id === selectedBranchId)?.name;

  useEffect(() => {
    if (!open) return;
    setMinLevel(item?.branchStock?.minLevel ?? '');
    setMaxLevel(item?.branchStock?.maxLevel ?? '');
    setReorderPoint(item?.branchStock?.reorderPoint ?? '');
    setError(null);
  }, [open, item]);

  if (!item) return null;

  const handleSubmit = async () => {
    setError(null);
    if (!selectedBranchId) {
      setError('Select a branch first.');
      return;
    }
    if (!minLevel || !reorderPoint) {
      setError('Minimum level and reorder point are required.');
      return;
    }
    if (maxLevel && parseFloat(maxLevel) < parseFloat(minLevel)) {
      setError(
        'Maximum level must be greater than or equal to the minimum level.',
      );
      return;
    }
    try {
      await setLevels.mutateAsync({
        itemId: item.id,
        branchId: selectedBranchId,
        minLevel: parseFloat(minLevel),
        maxLevel: maxLevel ? parseFloat(maxLevel) : undefined,
        reorderPoint: parseFloat(reorderPoint),
      });
      toast.success(`Stock levels updated for ${item.name}`);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Stock levels — {item.name}</DialogTitle>
          <DialogDescription>
            {branchName ? `At ${branchName}` : 'Select a branch first'}. Does
            not change quantity on hand, only when reorder alerts fire.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="minLevel">Minimum</Label>
            <Input
              id="minLevel"
              type="number"
              min="0"
              step="0.01"
              value={minLevel}
              onChange={(e) => setMinLevel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reorderPoint">Reorder point</Label>
            <Input
              id="reorderPoint"
              type="number"
              min="0"
              step="0.01"
              value={reorderPoint}
              onChange={(e) => setReorderPoint(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxLevel">Maximum (optional)</Label>
            <Input
              id="maxLevel"
              type="number"
              min="0"
              step="0.01"
              value={maxLevel}
              onChange={(e) => setMaxLevel(e.target.value)}
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={setLevels.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={setLevels.isPending}>
            {setLevels.isPending ? 'Saving…' : 'Save levels'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
