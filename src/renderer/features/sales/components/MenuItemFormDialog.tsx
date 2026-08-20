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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiError } from '@/lib/apiClient';
import { useAllItems } from '@/features/inventory/hooks/useAllItems';
import ItemPicker from '@/features/inventory/components/ItemPicker';
import { useRecipes } from '@/features/inventory/hooks/useRecipes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MenuItem } from '../../../../shared/salesTypes';
import { useCreateMenuItem, useUpdateMenuItem } from '../hooks/useMenu';

interface MenuItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuItem?: MenuItem;
}

export default function MenuItemFormDialog({
  open,
  onOpenChange,
  menuItem,
}: MenuItemFormDialogProps) {
  const isEdit = !!menuItem;
  const { items } = useAllItems();
  const { data: recipes } = useRecipes();
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();

  const [source, setSource] = useState<'item' | 'recipe'>('item');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [itemId, setItemId] = useState<string | null>(null);
  const [recipeId, setRecipeId] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSource(menuItem?.recipeId ? 'recipe' : 'item');
    setName(menuItem?.name ?? '');
    setDescription(menuItem?.description ?? '');
    setItemId(menuItem?.itemId ?? null);
    setRecipeId(menuItem?.recipeId ?? null);
    setPrice(menuItem ? (menuItem.priceCents / 100).toFixed(2) : '');
    setError(null);
  }, [open, menuItem]);

  const handleSubmit = async () => {
    setError(null);
    if (!name || !price) {
      setError('Name and price are required.');
      return;
    }
    if (source === 'item' && !itemId) {
      setError('Choose an inventory item.');
      return;
    }
    if (source === 'recipe' && !recipeId) {
      setError('Choose a recipe.');
      return;
    }
    const priceCents = Math.round(parseFloat(price) * 100);
    try {
      if (isEdit) {
        await updateMenuItem.mutateAsync({
          id: menuItem.id,
          name,
          description: description || undefined,
          priceCents,
        });
        toast.success('Menu item updated');
      } else {
        await createMenuItem.mutateAsync({
          name,
          description: description || undefined,
          priceCents,
          itemId: source === 'item' ? (itemId as string) : undefined,
          recipeId: source === 'recipe' ? (recipeId as string) : undefined,
        });
        toast.success('Menu item created');
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  const busy = createMenuItem.isPending || updateMenuItem.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit menu item' : 'New menu item'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="menuItemName">Name</Label>
            <Input
              id="menuItemName"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="menuItemDescription">Description (optional)</Label>
            <Textarea
              id="menuItemDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label>Wraps</Label>
              <Tabs
                value={source}
                onValueChange={(v) => setSource(v as 'item' | 'recipe')}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="item">
                    Inventory item (tot/bottle/can)
                  </TabsTrigger>
                  <TabsTrigger value="recipe">Cocktail recipe</TabsTrigger>
                </TabsList>
              </Tabs>
              {source === 'item' ? (
                <ItemPicker items={items} value={itemId} onChange={setItemId} />
              ) : (
                <Select
                  value={recipeId ?? undefined}
                  onValueChange={setRecipeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a recipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes?.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="menuItemPrice">Price</Label>
            <Input
              id="menuItemPrice"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={busy}>
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create menu item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
