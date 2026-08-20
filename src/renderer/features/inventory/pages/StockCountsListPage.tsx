import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BranchSelect from '@/components/inventory/BranchSelect';
import { useBranches } from '@/context/BranchContext';
import { formatDateTime } from '@/lib/format';
import { useRecentStockCounts } from '../hooks/useRecentStockCounts';
import { useStockCount } from '../hooks/useStockCounts';
import { StockCountStatusBadge } from '../components/StatusBadge';
import OpenStockCountDialog from '../components/OpenStockCountDialog';

function RecentCountRow({ id }: { id: string }) {
  const { data: count } = useStockCount(id);
  if (!count) return null;
  return (
    <Link
      to={`/inventory/stock-counts/${id}`}
      className="flex items-center justify-between rounded-md border p-3 text-sm hover:border-primary"
    >
      <span>
        {count.lines.length} item{count.lines.length === 1 ? '' : 's'} · opened{' '}
        {formatDateTime(count.createdAt)}
      </span>
      <StockCountStatusBadge status={count.status} />
    </Link>
  );
}

export default function StockCountsListPage() {
  const { selectedBranchId } = useBranches();
  const { recent } = useRecentStockCounts(selectedBranchId ?? undefined);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Stock takes</h1>
          <p className="text-sm text-muted-foreground">
            Periodic and cycle counts, with variance reporting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BranchSelect />
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> New count
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-2 pt-6">
          <p className="text-xs text-muted-foreground">
            Only counts opened from this app on this device are listed here —
            there is no server-side history endpoint yet.
          </p>
          {recent.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No stock counts yet for this branch.
            </p>
          )}
          {recent.map((entry) => (
            <RecentCountRow key={entry.id} id={entry.id} />
          ))}
        </CardContent>
      </Card>

      <OpenStockCountDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
