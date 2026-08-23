import { toast } from 'sonner';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import QueryState from '@/features/inventory/components/QueryState';
import { formatDateTime } from '@/lib/format';
import {
  useDiscardSyncIssue,
  useRetrySyncIssue,
  useSyncIssues,
} from '../hooks/useSyncIssues';

const ACTION_LABELS: { test: RegExp; label: string }[] = [
  { test: /\/orders\/bills\/.+\/payments/, label: 'Recording a payment' },
  { test: /\/orders\/payments\/.+\/void/, label: 'Voiding a payment' },
  { test: /\/orders\/.+\/lines\/.+\/void/, label: 'Voiding an order line' },
  { test: /\/orders\/.+\/lines/, label: 'Adding an order item' },
  { test: /\/orders\/.+\/bills\/split/, label: 'Splitting a bill' },
  { test: /\/orders\/.+\/bills\/join/, label: 'Joining bills' },
  { test: /\/orders\/bills\/.+\/discounts/, label: 'Applying a discount' },
  { test: /\/orders/, label: 'Updating an order' },
  { test: /\/inventory\/receipts/, label: 'Recording a delivery' },
  { test: /\/inventory\/losses/, label: 'Logging breakage or loss' },
  { test: /\/inventory\/recipes/, label: 'Saving a recipe' },
  { test: /\/inventory\/requisitions/, label: 'Requesting stock' },
  { test: /\/inventory\/stock-counts/, label: 'Saving a stock count' },
  { test: /\/inventory\/transfers/, label: 'Transferring stock' },
  { test: /\/expenses/, label: 'Saving an expense' },
  { test: /\/shifts/, label: 'Updating a shift' },
  { test: /\/menu/, label: 'Updating the menu' },
];

function describeAction(path: string): string {
  const match = ACTION_LABELS.find((entry) => entry.test.test(path));
  return match?.label ?? 'Saving a change';
}

export default function SyncIssuesPage() {
  const { data: issues, isLoading, error } = useSyncIssues();
  const retry = useRetrySyncIssue();
  const discard = useDiscardSyncIssue();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Things that didn&apos;t save</h1>
        <p className="text-sm text-muted-foreground">
          These were saved while offline, but didn&apos;t go through once the
          connection came back — usually because something changed in the
          meantime. Try again, or discard if it&apos;s no longer needed.
        </p>
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={(issues?.length ?? 0) === 0}
        emptyMessage="Nothing to review — everything saved fine."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>What</TableHead>
              <TableHead>What went wrong</TableHead>
              <TableHead>Tries so far</TableHead>
              <TableHead>When</TableHead>
              <TableHead className="text-right">Fix</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues?.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell>{describeAction(issue.path)}</TableCell>
                <TableCell>
                  <Badge variant="destructive">Didn&apos;t save</Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {issue.lastErrorMessage ??
                      'Ask a manager if this keeps happening.'}
                  </p>
                </TableCell>
                <TableCell>{issue.attemptCount}</TableCell>
                <TableCell>
                  {formatDateTime(new Date(issue.createdAt).toISOString())}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await retry.mutateAsync(issue.id);
                        toast.success('Trying again');
                      }}
                    >
                      <RotateCcw className="mr-1 h-3.5 w-3.5" /> Try again
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await discard.mutateAsync(issue.id);
                        toast.success('Discarded');
                      }}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Discard
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </QueryState>
    </div>
  );
}
