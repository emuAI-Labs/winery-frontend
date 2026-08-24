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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError } from '@/lib/apiClient';
import { ReusableAssetType } from '../../../../shared/assetsTypes';
import {
  useAdjustAssetStock,
  useReceiveAssetStock,
  useReportAssetLoss,
} from '../hooks/useReusableAssets';

export type StockActionMode = 'receive' | 'loss' | 'adjust';

const MODE_TITLE: Record<StockActionMode, string> = {
  receive: 'Receive stock',
  loss: 'Report loss or breakage',
  adjust: 'Adjust counted quantity',
};

interface AssetStockActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: StockActionMode;
  assetType: ReusableAssetType | null;
  branchId: string | null;
}

export default function AssetStockActionDialog({
  open,
  onOpenChange,
  mode,
  assetType,
  branchId,
}: AssetStockActionDialogProps) {
  const receiveStock = useReceiveAssetStock();
  const reportLoss = useReportAssetLoss();
  const adjustStock = useAdjustAssetStock();

  const [quantity, setQuantity] = useState('');
  const [lossType, setLossType] = useState<'lost' | 'broken'>('broken');
  const [reasonCode, setReasonCode] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isPending =
    receiveStock.isPending || reportLoss.isPending || adjustStock.isPending;

  useEffect(() => {
    if (!open) return;
    setQuantity('');
    setLossType('broken');
    setReasonCode('');
    setNotes('');
    setError(null);
  }, [open, mode]);

  const handleSubmit = async () => {
    setError(null);
    if (!assetType || !branchId) {
      setError('Select a branch first.');
      return;
    }
    if (!quantity) {
      setError('Quantity is required.');
      return;
    }
    if (mode === 'loss' && !reasonCode) {
      setError('A reason is required.');
      return;
    }
    try {
      if (mode === 'receive') {
        await receiveStock.mutateAsync({
          assetTypeId: assetType.id,
          branchId,
          quantity: parseInt(quantity, 10),
          notes: notes || undefined,
        });
        toast.success(`${assetType.name} stock received`);
      } else if (mode === 'loss') {
        await reportLoss.mutateAsync({
          assetTypeId: assetType.id,
          branchId,
          lossType,
          quantity: parseInt(quantity, 10),
          reasonCode,
          notes: notes || undefined,
        });
        toast.success(`Loss recorded for ${assetType.name}`);
      } else {
        await adjustStock.mutateAsync({
          assetTypeId: assetType.id,
          branchId,
          countedQuantity: parseInt(quantity, 10),
          notes: notes || undefined,
        });
        toast.success(`Count adjusted for ${assetType.name}`);
      }
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
            {MODE_TITLE[mode]}
            {assetType ? ` — ${assetType.name}` : ''}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {mode === 'loss' && (
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={lossType}
                onValueChange={(v) => setLossType(v as 'lost' | 'broken')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="broken">Broken</SelectItem>
                  <SelectItem value="lost">Lost / missing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="stockQuantity">
              {mode === 'adjust' ? 'Counted quantity' : 'Quantity'}
            </Label>
            <Input
              id="stockQuantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          {mode === 'loss' && (
            <div className="space-y-2">
              <Label htmlFor="reasonCode">Reason</Label>
              <Input
                id="reasonCode"
                value={reasonCode}
                onChange={(e) => setReasonCode(e.target.value)}
                placeholder="Dropped during service"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="stockNotes">Notes (optional)</Label>
            <Textarea
              id="stockNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
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
            {isPending ? 'Saving…' : MODE_TITLE[mode]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
