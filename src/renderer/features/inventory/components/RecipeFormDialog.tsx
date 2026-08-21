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
import {
  RecipeIngredient,
  RecipeIngredientUnit,
} from '../../../../shared/inventoryTypes';
import {
  useCreateRecipe,
  useRecipe,
  useUpdateRecipe,
} from '../hooks/useRecipes';
import { useAllItems } from '../hooks/useAllItems';
import ItemPicker from './ItemPicker';

interface RecipeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** the list screen only has RecipeSummary rows (no ingredients) — this
   * always fetches the full detail itself rather than trusting a passed-in
   * object, the same way OrderDetailPage always re-fetches. */
  recipeId?: string;
}

type DraftIngredient = {
  itemId: string | null;
  quantityUnit: RecipeIngredientUnit;
  quantity: string;
};

export default function RecipeFormDialog({
  open,
  onOpenChange,
  recipeId,
}: RecipeFormDialogProps) {
  const isEdit = !!recipeId;
  const { items } = useAllItems();
  const { data: recipe, isLoading: recipeLoading } = useRecipe(
    open ? recipeId : undefined,
  );
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<DraftIngredient[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (isEdit && !recipe) return; // wait for detail to load before populating
    setName(recipe?.name ?? '');
    setDescription(recipe?.description ?? '');
    setIngredients(
      recipe?.ingredients.map((ing) => ({
        itemId: ing.itemId,
        quantityUnit: ing.quantityUnit,
        quantity: String(ing.quantity),
      })) ?? [{ itemId: null, quantityUnit: 'ml', quantity: '' }],
    );
    setError(null);
  }, [open, isEdit, recipe]);

  const addIngredient = () =>
    setIngredients((prev) => [
      ...prev,
      { itemId: null, quantityUnit: 'ml', quantity: '' },
    ]);

  const removeIngredient = (index: number) =>
    setIngredients((prev) => prev.filter((_, i) => i !== index));

  const updateIngredient = (index: number, patch: Partial<DraftIngredient>) =>
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, ...patch } : ing)),
    );

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Give the recipe a name.');
      return;
    }
    const complete = ingredients.filter((i) => i.itemId && i.quantity);
    if (complete.length === 0) {
      setError('Add at least one ingredient.');
      return;
    }
    const ids = complete.map((i) => i.itemId);
    if (new Set(ids).size !== ids.length) {
      setError('Each ingredient can only appear once in a recipe.');
      return;
    }
    const mlIngredientsMissingVolume = complete.filter((i) => {
      if (i.quantityUnit !== 'ml') return false;
      const item = items.find((it) => it.id === i.itemId);
      return item && !item.unitVolumeMl;
    });
    if (mlIngredientsMissingVolume.length > 0) {
      setError(
        'One or more ml-based ingredients has no bottle volume set on its catalogue item — set that first, or switch this ingredient to "unit" (e.g. a garnish).',
      );
      return;
    }

    const payload: RecipeIngredient[] = complete.map((i) => ({
      itemId: i.itemId as string,
      quantityUnit: i.quantityUnit,
      quantity: parseFloat(i.quantity),
    }));

    try {
      if (isEdit) {
        await updateRecipe.mutateAsync({
          id: recipeId as string,
          name,
          description: description || undefined,
          ingredients: payload,
        });
        toast.success('Recipe updated');
      } else {
        await createRecipe.mutateAsync({
          name,
          description: description || undefined,
          ingredients: payload,
        });
        toast.success('Recipe created');
      }
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    }
  };

  const waitingForDetail = isEdit && recipeLoading;
  const busy =
    createRecipe.isPending || updateRecipe.isPending || waitingForDetail;
  const chosenIds = ingredients
    .map((i) => i.itemId)
    .filter((v): v is string => !!v);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit recipe' : 'New cocktail recipe'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipeName">Name</Label>
            <Input
              id="recipeName"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipeDescription">Description (optional)</Label>
            <Textarea
              id="recipeDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Ingredients</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addIngredient}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add ingredient
              </Button>
            </div>
            {/* eslint-disable react/no-array-index-key -- rows have no stable id until an item is picked */}
            <div className="space-y-2">
              {ingredients.map((ing, index) => (
                <div
                  key={index}
                  className="flex items-end gap-2 rounded-md border p-2"
                >
                  <div className="flex-1">
                    <ItemPicker
                      items={items}
                      value={ing.itemId}
                      onChange={(id) => updateIngredient(index, { itemId: id })}
                      excludeIds={chosenIds}
                      placeholder="Choose ingredient…"
                    />
                  </div>
                  <div className="w-24 space-y-1">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Qty"
                      value={ing.quantity}
                      onChange={(e) =>
                        updateIngredient(index, { quantity: e.target.value })
                      }
                    />
                  </div>
                  <Select
                    value={ing.quantityUnit}
                    onValueChange={(v) =>
                      updateIngredient(index, {
                        quantityUnit: v as RecipeIngredientUnit,
                      })
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="unit">unit</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeIngredient(index)}
                    disabled={ingredients.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            {/* eslint-enable react/no-array-index-key */}
            <p className="text-xs text-muted-foreground">
              Use &quot;ml&quot; for spirits/mixers measured by volume,
              &quot;unit&quot; for whole items like a garnish or a can — a
              garnish needs no bottle volume set.
            </p>
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
            {waitingForDetail
              ? 'Loading…'
              : busy
                ? 'Saving…'
                : isEdit
                  ? 'Save changes'
                  : 'Create recipe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
