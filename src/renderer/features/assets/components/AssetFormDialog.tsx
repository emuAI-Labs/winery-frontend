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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError } from '@/lib/apiClient';
import { useBranches } from '@/context/BranchContext';
import { AssetCategory } from '../../../../shared/assetsTypes';
import { useCreateAsset } from '../hooks/useAssets';

const CATEGORIES: AssetCategory[] = [
  'fridge',
  'cooler',
  'furniture',
  'pos_hardware',
  'sound_system',
  'other',
];

const CATEGORY_LABEL: Record<AssetCategory, string> = {
  fridge: 'Fridge',
  cooler: 'Cooler',
  furniture: 'Furniture',
  pos_hardware: 'POS hardware',
  sound_system: 'Sound system',
  other: 'Other',
};

interface AssetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AssetFormDialog({
  open,
  onOpenChange,
}: AssetFormDialogProps) {
  const { selectedBranchId } = useBranches();
  const createAsset = useCreateAsset();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<AssetCategory>('fridge');
  const [serialNumber, setSerialNumber] = useState('');
  const [location, setLocation] = useState('');
  const [purchaseValue, setPurchaseValue] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [usefulLifeMonths, setUsefulLifeMonths] = useState('60');
  const [salvageValue, setSalvageValue] = useState('0');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setCategory('fridge');
    setSerialNumber('');
    setLocation('');
    setPurchaseValue('');
    setPurchaseDate('');
    setUsefulLifeMonths('60');
    setSalvageValue('0');
    setError(null);
  }, [open]);

  const handleSubmit = async () => {
    setError(null);
    if (!selectedBranchId) {
      setError('Select a branch first.');
      return;
    }
    if (!name || !purchaseValue || !purchaseDate || !usefulLifeMonths) {
      setError(
        'Name, purchase value, purchase date, and useful life are required.',
      );
      return;
    }
    try {
      await createAsset.mutateAsync({
        branchId: selectedBranchId,
        name,
        category,
        serialNumber: serialNumber || undefined,
        location: location || undefined,
        purchaseValueCents: Math.round(parseFloat(purchaseValue) * 100),
        purchaseDate,
        usefulLifeMonths: parseInt(usefulLifeMonths, 10),
        salvageValueCents: Math.round(parseFloat(salvageValue || '0') * 100),
      });
      toast.success('Asset added to the register');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add asset</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assetName">Name</Label>
              <Input
                id="assetName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bar fridge #2"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as AssetCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial number (optional)</Label>
              <Input
                id="serialNumber"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Behind main bar"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseValue">Purchase value</Label>
              <Input
                id="purchaseValue"
                type="number"
                min="0"
                step="0.01"
                value={purchaseValue}
                onChange={(e) => setPurchaseValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase date</Label>
              <Input
                id="purchaseDate"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usefulLifeMonths">Useful life (months)</Label>
              <Input
                id="usefulLifeMonths"
                type="number"
                min="1"
                value={usefulLifeMonths}
                onChange={(e) => setUsefulLifeMonths(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="salvageValue">
              Salvage value at end of life (optional)
            </Label>
            <Input
              id="salvageValue"
              type="number"
              min="0"
              step="0.01"
              value={salvageValue}
              onChange={(e) => setSalvageValue(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createAsset.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createAsset.isPending}>
            {createAsset.isPending ? 'Saving…' : 'Add asset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
