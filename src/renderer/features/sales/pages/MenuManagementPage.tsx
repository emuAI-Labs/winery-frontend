import { useState } from 'react';
import { Plus, Pencil, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import QueryState from '@/features/inventory/components/QueryState';
import { formatCents } from '@/lib/format';
import { useMenuItems } from '../hooks/useMenu';
import MenuItemFormDialog from '../components/MenuItemFormDialog';
import PricingRulesDialog from '../components/PricingRulesDialog';
import { MenuItem } from '../../../../shared/salesTypes';

export default function MenuManagementPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useMenuItems({
    search: search || undefined,
  });
  const [itemDialog, setItemDialog] = useState<{
    open: boolean;
    item?: MenuItem;
  }>({ open: false });
  const [pricingItem, setPricingItem] = useState<MenuItem | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Menu</h1>
          <p className="text-sm text-muted-foreground">
            What staff tap to sell — each item wraps one inventory item or
            cocktail recipe.
          </p>
        </div>
        <Button onClick={() => setItemDialog({ open: true })}>
          <Plus className="mr-1 h-4 w-4" /> Add menu item
        </Button>
      </div>

      <Input
        placeholder="Search menu…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={(data?.items.length ?? 0) === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Wraps</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{item.name}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground">
                      {item.description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {item.recipeId ? 'Recipe' : 'Item'}
                  </Badge>
                </TableCell>
                <TableCell>{formatCents(item.priceCents)}</TableCell>
                <TableCell>
                  <Badge variant={item.isActive ? 'success' : 'secondary'}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Edit"
                      onClick={() => setItemDialog({ open: true, item })}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Pricing rules"
                      onClick={() => setPricingItem(item)}
                    >
                      <Percent className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </QueryState>

      <MenuItemFormDialog
        open={itemDialog.open}
        onOpenChange={(v) => setItemDialog({ open: v })}
        menuItem={itemDialog.item}
      />
      <PricingRulesDialog
        open={!!pricingItem}
        onOpenChange={(v) => !v && setPricingItem(null)}
        menuItem={pricingItem}
      />
    </div>
  );
}
