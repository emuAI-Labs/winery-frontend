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

export default function SyncIssuesPage() {
  const { data: issues, isLoading, error } = useSyncIssues();
  const retry = useRetrySyncIssue();
  const discard = useDiscardSyncIssue();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Sync issues</h1>
        <p className="text-sm text-muted-foreground">
          Actions that were saved offline but the server rejected once
          reconnected — usually because something changed in the meantime.
          Review, then retry or discard.
        </p>
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={(issues?.length ?? 0) === 0}
        emptyMessage="Nothing needs attention — everything synced cleanly."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Saved</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issues?.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell className="font-mono text-xs">
                  {issue.method} {issue.path}
                </TableCell>
                <TableCell>
                  <Badge variant="destructive">
                    {issue.lastErrorCode ?? 'ERROR'}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {issue.lastErrorMessage}
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
                        toast.success('Queued for another attempt');
                      }}
                    >
                      <RotateCcw className="mr-1 h-3.5 w-3.5" /> Retry
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
