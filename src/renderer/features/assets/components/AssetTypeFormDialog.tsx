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
import { ReusableAssetCategory } from '../../../../shared/assetsTypes';
import { useCreateAssetType } from '../hooks/useReusableAssets';

const CATEGORIES: ReusableAssetCategory[] = [
  'glassware',
  'keg',
  'crate',
  'tool',
  'other',
];

interface AssetTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AssetTypeFormDialog({
  open,
  onOpenChange,
}: AssetTypeFormDialogProps) {
  const createType = useCreateAssetType();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ReusableAssetCategory>('glassware');
  const [unitValue, setUnitValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setCategory('glassware');
    setUnitValue('');
    setError(null);
  }, [open]);

  const handleSubmit = async () => {
    setError(null);
    if (!name) {
      setError('Name is required.');
      return;
    }
    try {
      await createType.mutateAsync({
        name,
        category,
        unitValueCents: unitValue
          ? Math.round(parseFloat(unitValue) * 100)
          : undefined,
      });
      toast.success('Item type added');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add reusable item type</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="typeName">Name</Label>
            <Input
              id="typeName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Highball glass"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ReusableAssetCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitValue">Replacement cost (optional)</Label>
              <Input
                id="unitValue"
                type="number"
                min="0"
                step="0.01"
                value={unitValue}
                onChange={(e) => setUnitValue(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createType.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createType.isPending}>
            {createType.isPending ? 'Saving…' : 'Add type'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
