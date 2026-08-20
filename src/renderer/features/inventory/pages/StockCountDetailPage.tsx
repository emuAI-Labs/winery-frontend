import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatMoney, formatQty, parseQty } from '@/lib/format';
import { ApiError } from '@/lib/apiClient';
import {
  useStockCount,
  useSubmitStockCountLines,
  useFinalizeStockCount,
} from '../hooks/useStockCounts';
import { StockCountStatusBadge } from '../components/StatusBadge';
import QueryState from '../components/QueryState';

export default function StockCountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: count, isLoading, error } = useStockCount(id);
  const submitLines = useSubmitStockCountLines();
  const finalize = useFinalizeStockCount();

  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isSubmitted = count?.status === 'submitted';

  const handleSaveProgress = async () => {
    if (!id) return;
    const lines = Object.entries(drafts)
      .filter(([, v]) => v !== '')
      .map(([itemId, v]) => ({ itemId, countedQuantity: parseFloat(v) }));
    if (lines.length === 0) {
      toast.info('Nothing to save yet — enter a counted quantity first.');
      return;
    }
    try {
      await submitLines.mutateAsync({ id, lines });
      toast.success(`Saved ${lines.length} counted line(s)`);
      setDrafts({});
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Could not save progress.',
      );
    }
  };

  const handleFinalize = async () => {
    if (!id) return;
    try {
      await finalize.mutateAsync(id);
      toast.success('Stock count finalized');
      setConfirmOpen(false);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Could not finalize.',
      );
    }
  };

  const uncountedCount =
    count?.lines.filter((l) => l.countedQuantity === null).length ?? 0;

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        to="/inventory/stock-counts"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to stock takes
      </Link>

      <QueryState isLoading={isLoading} error={error}>
        {count && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">Stock count</h1>
                <p className="text-sm text-muted-foreground">
                  {count.lines.length} item{count.lines.length === 1 ? '' : 's'}
                  {count.notes ? ` · ${count.notes}` : ''}
                </p>
              </div>
              <StockCountStatusBadge status={count.status} />
            </div>

            {!isSubmitted && (
              <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                Variance is calculated against the system quantity as of when
                this count was opened, not live stock — that is intentional. You
                do not need to count every line before submitting; uncounted
                lines are simply left alone.
              </p>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>System qty at count start</TableHead>
                  <TableHead>Counted</TableHead>
                  {isSubmitted && <TableHead>Variance value</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {count.lines.map((line) => {
                  const unit = line.item?.stockUnit ?? 'unit';
                  return (
                    <TableRow key={line.itemId}>
                      <TableCell>{line.item?.name ?? line.itemId}</TableCell>
                      <TableCell>
                        {formatQty(line.systemQuantity, unit)}
                      </TableCell>
                      <TableCell>
                        {isSubmitted ? (
                          line.countedQuantity === null ? (
                            <span className="text-muted-foreground">
                              Not counted
                            </span>
                          ) : (
                            formatQty(line.countedQuantity, unit)
                          )
                        ) : (
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-28"
                            placeholder={
                              line.countedQuantity !== null
                                ? parseQty(line.countedQuantity).toString()
                                : '—'
                            }
                            value={drafts[line.itemId] ?? ''}
                            onChange={(e) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [line.itemId]: e.target.value,
                              }))
                            }
                          />
                        )}
                      </TableCell>
                      {isSubmitted && (
                        <TableCell>
                          {line.varianceValue
                            ? formatMoney(line.varianceValue)
                            : '—'}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {!isSubmitted && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {uncountedCount > 0
                    ? `${uncountedCount} item(s) not yet counted`
                    : 'All items counted'}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSaveProgress}
                    disabled={submitLines.isPending}
                  >
                    {submitLines.isPending ? 'Saving…' : 'Save progress'}
                  </Button>
                  <Button onClick={() => setConfirmOpen(true)}>
                    Finalize count
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </QueryState>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalize this count?</DialogTitle>
            <DialogDescription>
              This is final — a submitted count cannot be reopened or
              resubmitted. Uncounted items are left as-is; counted items
              generate stock adjustments for any variance.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={finalize.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleFinalize} disabled={finalize.isPending}>
              {finalize.isPending ? 'Finalizing…' : 'Finalize'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
