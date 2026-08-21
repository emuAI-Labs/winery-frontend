import { useEffect, useState } from 'react';
import { AlertTriangle, PackageSearch } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBranches } from '@/context/BranchContext';
import PaginationControls from '@/components/ui/pagination-controls';
import { formatQty } from '@/lib/format';
import {
  useConsolidatedStock,
  useExpiryWarnings,
  useDeadStock,
} from '../hooks/useStockReports';
import QueryState from '../components/QueryState';

export default function StockOverviewPage() {
  const { selectedBranchId } = useBranches();
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [viewAllBranches, setViewAllBranches] = useState(false);
  const [offset, setOffset] = useState(0);

  const branchId = viewAllBranches
    ? undefined
    : (selectedBranchId ?? undefined);
  // Capped at the API's max (100) rather than the 50 default — this is a
  // manager-facing overview, and the search box below only filters whatever
  // page is loaded (the API has no search param on this endpoint), so a
  // bigger page keeps that search useful without needing full server-side
  // search here.
  const { data, isLoading, error } = useConsolidatedStock({
    branchId,
    lowStockOnly,
    limit: 100,
    offset,
  });
  const { data: expiry } = useExpiryWarnings(selectedBranchId ?? undefined, 14);
  const { data: deadStock } = useDeadStock(selectedBranchId ?? undefined, 30);

  useEffect(() => {
    setOffset(0);
  }, [branchId, lowStockOnly]);

  const items = (data?.items ?? []).filter(
    (i) =>
      !search ||
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.sku.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Items tracked
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {data?.total ?? '—'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-amber-700">
              <AlertTriangle className="h-4 w-4" /> Expiring within 14 days
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {expiry?.total ?? '—'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <PackageSearch className="h-4 w-4" /> Dead stock (30d, this
              branch)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {deadStock?.total ?? '—'}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Search by name or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- Switch is a button, not a labelable form control; it's independently focusable/toggleable */}
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={lowStockOnly} onCheckedChange={setLowStockOnly} />
          Low stock only
        </label>
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- see above */}
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={viewAllBranches}
            onCheckedChange={setViewAllBranches}
          />
          All branches
        </label>
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={items.length === 0}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>On hand</TableHead>
              {viewAllBranches && <TableHead>By branch</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const branchLine = item.branches[0];
              const isLow =
                branchLine &&
                parseFloat(branchLine.quantityOnHand) <=
                  parseFloat(branchLine.reorderPoint);
              return (
                <TableRow key={item.itemId}>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.sku}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{item.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {formatQty(item.totalOnHand, item.stockUnit)}
                      {!viewAllBranches && isLow && (
                        <Badge variant="warning">Reorder</Badge>
                      )}
                    </div>
                  </TableCell>
                  {viewAllBranches && (
                    <TableCell className="text-xs text-muted-foreground">
                      {item.branches
                        .map(
                          (b) =>
                            `${b.branchName}: ${formatQty(b.quantityOnHand, item.stockUnit)}`,
                        )
                        .join(' · ')}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </QueryState>
      {data && (
        <PaginationControls
          offset={offset}
          limit={data.limit}
          total={data.total}
          onOffsetChange={setOffset}
        />
      )}
      {!viewAllBranches && !selectedBranchId && (
        <p className="text-sm text-muted-foreground">
          Select a branch above, or switch to &quot;All branches&quot; to see
          consolidated stock.
        </p>
      )}
    </div>
  );
}
