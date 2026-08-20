import { useState } from 'react';
import { Plus, Settings2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBranches } from '@/context/BranchContext';
import { formatMoney, formatQty } from '@/lib/format';
import { useItems } from '../hooks/useItems';
import { useRecipes } from '../hooks/useRecipes';
import QueryState from '../components/QueryState';
import ItemFormDialog from '../components/ItemFormDialog';
import BranchStockDialog from '../components/BranchStockDialog';
import RecipeFormDialog from '../components/RecipeFormDialog';
import {
  InventoryItem,
  ItemCategory,
  Recipe,
} from '../../../../shared/inventoryTypes';

const CATEGORIES: (ItemCategory | 'all')[] = [
  'all',
  'spirit',
  'beer',
  'wine',
  'mixer',
  'food',
  'glassware',
  'consumable',
  'other',
];

function ItemsTab() {
  const { selectedBranchId } = useBranches();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ItemCategory | 'all'>('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [itemDialog, setItemDialog] = useState<{
    open: boolean;
    item?: InventoryItem;
  }>({
    open: false,
  });
  const [stockDialog, setStockDialog] = useState<InventoryItem | null>(null);

  const { data, isLoading, error } = useItems({
    branchId: selectedBranchId ?? undefined,
    category: category === 'all' ? undefined : category,
    search: search || undefined,
    lowStock: lowStockOnly,
    limit: 100,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={category}
          onValueChange={(v) => setCategory(v as ItemCategory | 'all')}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c === 'all' ? 'All categories' : c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- Switch is a button, not a labelable form control; it's independently focusable/toggleable */}
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={lowStockOnly} onCheckedChange={setLowStockOnly} />
          Low stock only
        </label>
        <div className="flex-1" />
        <Button onClick={() => setItemDialog({ open: true })}>
          <Plus className="mr-1 h-4 w-4" /> Add item
        </Button>
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={(data?.items.length ?? 0) === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Pour</TableHead>
              <TableHead>
                On hand{selectedBranchId ? '' : ' (select a branch)'}
              </TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.sku}
                  </div>
                </TableCell>
                <TableCell className="capitalize">{item.category}</TableCell>
                <TableCell className="capitalize">{item.stockUnit}</TableCell>
                <TableCell>{formatMoney(item.costPrice)}</TableCell>
                <TableCell>
                  {item.isPourable ? (
                    <Badge variant="secondary">{item.defaultPourMl}ml</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {selectedBranchId ? (
                    item.branchStock ? (
                      <div className="flex items-center gap-2">
                        {formatQty(
                          item.branchStock.quantityOnHand,
                          item.stockUnit,
                        )}
                        {parseFloat(item.branchStock.quantityOnHand) <=
                          parseFloat(item.branchStock.reorderPoint) && (
                          <Badge variant="warning">Reorder</Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Not stocked here
                      </span>
                    )
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Edit item"
                      onClick={() => setItemDialog({ open: true, item })}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Stock levels at this branch"
                      onClick={() => setStockDialog(item)}
                      disabled={!selectedBranchId}
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </QueryState>

      <ItemFormDialog
        open={itemDialog.open}
        onOpenChange={(openVal) => setItemDialog({ open: openVal })}
        item={itemDialog.item}
      />
      <BranchStockDialog
        open={!!stockDialog}
        onOpenChange={(openVal) => !openVal && setStockDialog(null)}
        item={stockDialog}
      />
    </div>
  );
}

function RecipesTab() {
  const { data: recipes, isLoading, error } = useRecipes();
  const [dialog, setDialog] = useState<{ open: boolean; recipe?: Recipe }>({
    open: false,
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialog({ open: true })}>
          <Plus className="mr-1 h-4 w-4" /> New recipe
        </Button>
      </div>
      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={(recipes?.length ?? 0) === 0}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes?.map((recipe) => (
            <button
              key={recipe.id}
              type="button"
              onClick={() => setDialog({ open: true, recipe })}
              className="rounded-lg border p-4 text-left transition-colors hover:border-primary"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{recipe.name}</h3>
                {!recipe.isActive && (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
              {recipe.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {recipe.description}
                </p>
              )}
              <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                {recipe.ingredients.map((ing) => (
                  <li key={ing.itemId}>
                    {ing.item?.name ?? ing.itemId} — {ing.quantity}
                    {ing.quantityUnit === 'ml' ? 'ml' : ` ${ing.quantityUnit}`}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </QueryState>
      <RecipeFormDialog
        open={dialog.open}
        onOpenChange={(openVal) => setDialog({ open: openVal })}
        recipe={dialog.recipe}
      />
    </div>
  );
}

export default function CataloguePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Catalogue</h1>
        <p className="text-sm text-muted-foreground">
          Items, units of measure, and cocktail recipes used for depletion.
        </p>
      </div>
      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
        </TabsList>
        <TabsContent value="items">
          <ItemsTab />
        </TabsContent>
        <TabsContent value="recipes">
          <RecipesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
