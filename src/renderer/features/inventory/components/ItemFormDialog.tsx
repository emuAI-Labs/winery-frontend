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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApiError } from '@/lib/apiClient';
import {
  InventoryItem,
  ItemCategory,
  StockUnit,
} from '../../../../shared/inventoryTypes';
import { useCreateItem, useUpdateItem } from '../hooks/useItems';

const CATEGORIES: ItemCategory[] = [
  'spirit',
  'beer',
  'wine',
  'mixer',
  'food',
  'glassware',
  'consumable',
  'other',
];
const STOCK_UNITS: StockUnit[] = ['bottle', 'can', 'keg', 'case', 'unit'];

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: InventoryItem;
}

export default function ItemFormDialog({
  open,
  onOpenChange,
  item,
}: ItemFormDialogProps) {
  const isEdit = !!item;
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('spirit');
  const [stockUnit, setStockUnit] = useState<StockUnit>('bottle');
  const [costPrice, setCostPrice] = useState('');
  const [isPourable, setIsPourable] = useState(false);
  const [unitVolumeMl, setUnitVolumeMl] = useState('');
  const [defaultPourMl, setDefaultPourMl] = useState('');
  const [expiryTracked, setExpiryTracked] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSku(item?.sku ?? '');
    setName(item?.name ?? '');
    setCategory(item?.category ?? 'spirit');
    setStockUnit(item?.stockUnit ?? 'bottle');
    setCostPrice(item ? String(item.costPrice) : '');
    setIsPourable(item?.isPourable ?? false);
    setUnitVolumeMl(item?.unitVolumeMl ? String(item.unitVolumeMl) : '');
    setDefaultPourMl(item?.defaultPourMl ? String(item.defaultPourMl) : '');
    setExpiryTracked(item?.expiryTracked ?? false);
    setFormError(null);
  }, [open, item]);

  const pourFieldsMissing = isPourable && (!unitVolumeMl || !defaultPourMl);

  const handleSubmit = async () => {
    setFormError(null);
    if (!sku || !name || !costPrice) {
      setFormError('SKU, name, and cost price are required.');
      return;
    }
    if (pourFieldsMissing) {
      setFormError(
        'Set a bottle volume and a pour size before marking this item pourable.',
      );
      return;
    }

    const body = {
      name,
      category,
      stockUnit,
      costPrice: parseFloat(costPrice),
      isPourable,
      unitVolumeMl: unitVolumeMl ? parseFloat(unitVolumeMl) : undefined,
      defaultPourMl: defaultPourMl ? parseFloat(defaultPourMl) : undefined,
      expiryTracked,
    };

    try {
      if (isEdit) {
        await updateItem.mutateAsync({ id: item.id, ...body });
        toast.success('Item updated');
      } else {
        await createItem.mutateAsync({ sku, ...body });
        toast.success('Item created');
      }
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'CONFLICT') {
        setFormError('An item with this SKU already exists.');
      } else if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    }
  };

  const busy = createItem.isPending || updateItem.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit item' : 'Add catalogue item'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                disabled={isEdit}
                placeholder="jw-black"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ItemCategory)}
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
              <Label>Stock unit</Label>
              <Select
                value={stockUnit}
                onValueChange={(v) => setStockUnit(v as StockUnit)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STOCK_UNITS.map((u) => (
                    <SelectItem key={u} value={u} className="capitalize">
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="costPrice">Cost price (per {stockUnit})</Label>
            <Input
              id="costPrice"
              type="number"
              min="0"
              step="0.01"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="isPourable"
              checked={isPourable}
              onCheckedChange={(v) => setIsPourable(v === true)}
            />
            <Label htmlFor="isPourable">
              Pourable (sold as tots/shots from this unit)
            </Label>
          </div>
          {isPourable && (
            <div className="grid grid-cols-2 gap-4 rounded-md border p-3">
              <div className="space-y-2">
                <Label htmlFor="unitVolumeMl">
                  Volume per {stockUnit} (ml)
                </Label>
                <Input
                  id="unitVolumeMl"
                  type="number"
                  min="1"
                  value={unitVolumeMl}
                  onChange={(e) => setUnitVolumeMl(e.target.value)}
                  placeholder="750"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultPourMl">Standard pour (ml)</Label>
                <Input
                  id="defaultPourMl"
                  type="number"
                  min="1"
                  value={defaultPourMl}
                  onChange={(e) => setDefaultPourMl(e.target.value)}
                  placeholder="25"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id="expiryTracked"
              checked={expiryTracked}
              onCheckedChange={(v) => setExpiryTracked(v === true)}
            />
            <Label htmlFor="expiryTracked">
              Track expiry (batch/best-before dates recorded on receipt)
            </Label>
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={busy || pourFieldsMissing}>
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
